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

    // Existing additional providers
    openrouter: !!(env?.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY),
    qwen: !!(env?.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY),
    moonshot: !!(env?.MOONSHOT_API_KEY || process.env.MOONSHOT_API_KEY),
    cerebras: !!(env?.CEREBRAS_API_KEY || process.env.CEREBRAS_API_KEY),

    // New Tier 1 providers
    groq: !!(env?.GROQ_API_KEY || process.env.GROQ_API_KEY),
    together: !!(env?.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY),
    perplexity: !!(env?.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY),
    cohere: !!(env?.COHERE_API_KEY || process.env.COHERE_API_KEY),
    fireworks: !!(env?.FIREWORKS_API_KEY || process.env.FIREWORKS_API_KEY),

    // Bedrock requires multiple envs; mark configured if region and both keys present
    bedrock: !!(
      (env?.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
      (env?.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY) &&
      (env?.AWS_REGION || process.env.AWS_REGION)
    ),
  };

  return json({ providers });
}
