import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const body = await request.json<{ message: string; model?: string }>();
  const { message } = body;

  // extract model selection from request body (optional)
  const fullModelId = body?.model as string | undefined;

  const enhancerMessages = [
    {
      role: 'user' as const,
      content: stripIndents`
        I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

        IMPORTANT: Only respond with the improved prompt and nothing else!

        <original_prompt>
          ${message}
        </original_prompt>
      `,
    },
  ];

  try {
    const result = await streamText(enhancerMessages, context.cloudflare.env, {
      fullModelId, // pass model selection to streamText
    });

    // return plain text stream with the improved prompt
    return result.toTextStreamResponse();
  } catch (error) {
    console.log(error);

    // check if error is related to missing API key
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Missing API key')) {
      // if API key is missing and user specified a model, try to fall back to default
      if (fullModelId) {
        console.log(`API key missing for selected model, falling back to default model`);

        try {
          const result = await streamText(enhancerMessages, context.cloudflare.env, {
            // don't specify fullModelId to use default
          });

          return result.toTextStreamResponse();
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
