import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

/**
 * API route to check which AI provider API keys are configured
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare?.env as any;

  // Check which API keys are available
  const providers = {
    anthropic: !!(env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY),
    openai: !!(env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY),
    google: !!(env?.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY),
    deepseek: !!(env?.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY),
    xai: !!(env?.XAI_API_KEY || process.env.XAI_API_KEY),
    mistral: !!(env?.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY),
    zai: !!(env?.ZAI_API_KEY || process.env.ZAI_API_KEY),
  };

  return json({ providers });
}
