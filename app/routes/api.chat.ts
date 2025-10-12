import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { ModelMessage, UIMessage } from 'ai';
import { MAX_RESPONSE_SEGMENTS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type StreamTextOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

function uiToModelMessages(uiMessages: UIMessage[]): ModelMessage[] {
  return uiMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const text = Array.isArray((m as any).parts)
        ? (m as any).parts
            .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
            .map((p: any) => p.text)
            .join('')
        : ((m as any).content ?? '');
      return { role: m.role as 'user' | 'assistant', content: text };
    });
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const body = (await request.json()) as any;
  const uiMessages = (body?.messages ?? []) as UIMessage[];
  const messages = uiToModelMessages(uiMessages);

  // extract model selection from request body (optional)
  const fullModelId = body?.model as string | undefined;

  // extract AI settings from request body (optional)
  const temperature = body?.temperature as number | undefined;
  const maxTokens = body?.maxTokens as number | undefined;

  // extract chat mode from request body (optional)
  let mode = (body?.mode as 'normal' | 'plan' | 'discussion') ?? 'normal';

  // If the last user message contains an approved plan marker, force execution mode
  try {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const lastContent = lastUser?.content || '';

    if (typeof lastContent === 'string' && /<approved_plan[\s>]/i.test(lastContent)) {
      mode = 'normal';
    }
  } catch {
    // ignore
  }

  const stream = new SwitchableStream();

  // define onFinish handler that can be reused
  const createOnFinishHandler = (streamOptions: StreamTextOptions) => {
    return async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
      if (finishReason !== 'length') {
        return stream.close();
      }

      if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
        throw Error('Cannot continue message: Maximum segments reached');
      }

      const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
      console.log(`Reached model token limit: Continuing message (${switchesLeft} switches left)`);

      messages.push({ role: 'assistant', content });
      messages.push({ role: 'user', content: CONTINUE_PROMPT });

      const continued = await streamText(messages, context.cloudflare.env, streamOptions);

      const continuedResp = continued.toUIMessageStreamResponse({
        sendStart: false,
        sendFinish: true,
        messageMetadata: (args) => continued.usageMetadata(args),
      });

      return stream.switchSource(continuedResp.body!);
    };
  };

  try {
    const options: StreamTextOptions = {
      toolChoice: 'none',
      fullModelId, // pass model selection to streamText
      temperature, // pass temperature setting
      maxTokens, // pass max tokens setting
      mode, // pass chat mode to streamText
    };

    options.onFinish = createOnFinishHandler(options);

    const result = await streamText(messages, context.cloudflare.env, options);

    const resp = result.toUIMessageStreamResponse({
      sendFinish: true,
      messageMetadata: (args) => result.usageMetadata(args),
    });

    await stream.switchSource(resp.body!);

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    // check if error is related to missing API key
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Missing API key')) {
      // if API key is missing and user specified a model, try to fall back to default
      if (fullModelId) {
        console.log(`API key missing for selected model, falling back to default model`);

        try {
          const fallbackOptions: StreamTextOptions = {
            toolChoice: 'none',

            // don't specify fullModelId to use default
          };

          fallbackOptions.onFinish = createOnFinishHandler(fallbackOptions);

          const result = await streamText(messages, context.cloudflare.env, fallbackOptions);

          const resp = result.toUIMessageStreamResponse({
            sendFinish: true,
            messageMetadata: (args) => result.usageMetadata(args),
          });

          await stream.switchSource(resp.body!);

          return new Response(stream.readable, {
            status: 200,
            headers: {
              contentType: 'text/plain; charset=utf-8',
            },
          });
        } catch (fallbackError) {
          console.error('Fallback to default model also failed:', fallbackError);
        }
      }

      throw new Response(errorMessage, {
        status: 401,
        statusText: 'API Key Missing',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
