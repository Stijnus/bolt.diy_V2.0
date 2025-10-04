import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { ModelMessage, UIMessage } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type StreamingOptions } from '~/lib/.server/llm/stream-text';
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
        : (m as any).content ?? '';
      return { role: m.role as 'user' | 'assistant', content: text };
    });
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const body = (await request.json()) as any;
  const uiMessages = (body?.messages ?? []) as UIMessage[];
  const messages = uiToModelMessages(uiMessages);

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const continued = await streamText(messages, context.cloudflare.env, options);
        const continuedResp = continued.toUIMessageStreamResponse({ sendStart: false });
        return stream.switchSource(continuedResp.body!);
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options);
    const resp = result.toUIMessageStreamResponse({ sendFinish: false });

    await stream.switchSource(resp.body!);

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
