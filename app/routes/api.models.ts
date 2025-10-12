import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

/**
 * GET /api/models
 * Returns dynamic per-provider model counts, based on which API keys are configured.
 * Caches results in-memory with a short TTL to avoid rate limits.
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Minimal cache in worker scope
const cacheKey = 'MODEL_COUNTS_CACHE_V1';

interface CountsCacheEntry {
  ts: number;
  counts: Record<string, number>;
}

function getEnvVar(env: any, key: string): string | undefined {
  return env?.[key] || process.env[key];
}

function getHeaderKey(request: Request, provider: string): string | undefined {
  const h = request.headers;
  return (h.get(`x-api-key-${provider}`) || h.get(`${provider}-api-key`) || undefined) as string | undefined;
}

async function safeFetchCount(url: string, init?: RequestInit): Promise<number> {
  try {
    const res = await fetch(url, init);

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();

    /*
     * Heuristics per provider payloads
     * - OpenRouter: { data: [ { id, name, ... } ] }
     */
    if (Array.isArray((data as any).data)) {
      return (data as any).data.length;
    }

    // - Many providers return { models: [ ... ] }
    if (Array.isArray((data as any).models)) {
      return (data as any).models.length;
    }

    // Fallback: try common array roots
    if (Array.isArray(data)) {
      return (data as any[]).length;
    }

    return 0;
  } catch {
    return 0;
  }
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const env = (context as any)?.cloudflare?.env as any;

  // Serve cached if valid and no refresh requested
  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const g: any = globalThis as any;
  const cached: CountsCacheEntry | undefined = g[cacheKey];

  if (!refresh && cached && Date.now() - cached.ts < TTL_MS) {
    return json({ counts: cached.counts, cached: true });
  }

  const counts: Record<string, number> = {};

  // OpenRouter
  const OPENROUTER_API_KEY = getHeaderKey(request, 'openrouter') || getEnvVar(env, 'OPENROUTER_API_KEY');

  if (OPENROUTER_API_KEY) {
    const orHeaders: Record<string, string> = {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    };

    const orRef = getEnvVar(env, 'OPENROUTER_APP_REFERRER');

    if (orRef) {
      orHeaders['HTTP-Referer'] = orRef;
    }

    const orTitle = getEnvVar(env, 'OPENROUTER_APP_TITLE');

    if (orTitle) {
      orHeaders['X-Title'] = orTitle;
    }

    counts.openrouter = await safeFetchCount('https://openrouter.ai/api/v1/models', {
      headers: orHeaders,
    });
  }

  // DeepSeek
  const DEEPSEEK_API_KEY = getHeaderKey(request, 'deepseek') || getEnvVar(env, 'DEEPSEEK_API_KEY');

  if (DEEPSEEK_API_KEY) {
    counts.deepseek = 2; // deepseek-chat, deepseek-reasoner
  }

  // xAI (Grok)
  const XAI_API_KEY = getHeaderKey(request, 'xai') || getEnvVar(env, 'XAI_API_KEY');

  if (XAI_API_KEY) {
    counts.xai = await safeFetchCount('https://api.x.ai/v1/language-models', {
      headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    });
  }

  // Mistral
  const MISTRAL_API_KEY = getHeaderKey(request, 'mistral') || getEnvVar(env, 'MISTRAL_API_KEY');

  if (MISTRAL_API_KEY) {
    counts.mistral = await safeFetchCount('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
    });
  }

  // Google Gemini (API key in query)
  const GOOGLE_API_KEY = getHeaderKey(request, 'google') || getEnvVar(env, 'GOOGLE_API_KEY');

  if (GOOGLE_API_KEY) {
    counts.google = await safeFetchCount(`https://generativelanguage.googleapis.com/v1/models?key=${GOOGLE_API_KEY}`);
  }

  // Moonshot (Kimi)
  const MOONSHOT_API_KEY = getHeaderKey(request, 'moonshot') || getEnvVar(env, 'MOONSHOT_API_KEY');

  if (MOONSHOT_API_KEY) {
    counts.moonshot = await safeFetchCount('https://api.moonshot.ai/v1/models', {
      headers: { Authorization: `Bearer ${MOONSHOT_API_KEY}` },
    });
  }

  // Cerebras
  const CEREBRAS_API_KEY = getHeaderKey(request, 'cerebras') || getEnvVar(env, 'CEREBRAS_API_KEY');

  if (CEREBRAS_API_KEY) {
    counts.cerebras = await safeFetchCount('https://api.cerebras.ai/v1/models', {
      headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}` },
    });
  }

  // Qwen (DashScope) — OpenAI-compatible mode
  const DASHSCOPE_API_KEY = getHeaderKey(request, 'qwen') || getEnvVar(env, 'DASHSCOPE_API_KEY');

  if (DASHSCOPE_API_KEY) {
    counts.qwen = await safeFetchCount('https://dashscope.aliyuncs.com/compatible-mode/v1/models', {
      headers: { Authorization: `Bearer ${DASHSCOPE_API_KEY}` },
    });
  }

  /*
   * Anthropic & OpenAI have no public list-models endpoints, but we can return
   * static counts based on our known model configurations when API keys are present.
   */

  // Anthropic - return static count of 3 models (Claude 3.5 Sonnet New, Haiku, Opus)
  const ANTHROPIC_API_KEY = getHeaderKey(request, 'anthropic') || getEnvVar(env, 'ANTHROPIC_API_KEY');

  if (ANTHROPIC_API_KEY) {
    counts.anthropic = 3;
  }

  // OpenAI - return static count of 6 models (GPT-5, GPT-5 Mini, GPT-4.1, o3, o4-mini, GPT-4o)
  const OPENAI_API_KEY = getHeaderKey(request, 'openai') || getEnvVar(env, 'OPENAI_API_KEY');

  if (OPENAI_API_KEY) {
    counts.openai = 6;
  }

  // Groq
  const GROQ_API_KEY = getHeaderKey(request, 'groq') || getEnvVar(env, 'GROQ_API_KEY');

  if (GROQ_API_KEY) {
    counts.groq = await safeFetchCount('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    });
  }

  // Together AI
  const TOGETHER_API_KEY = getHeaderKey(request, 'together') || getEnvVar(env, 'TOGETHER_API_KEY');

  if (TOGETHER_API_KEY) {
    counts.together = await safeFetchCount('https://api.together.xyz/v1/models', {
      headers: { Authorization: `Bearer ${TOGETHER_API_KEY}` },
    });
  }

  // Perplexity AI (no public list endpoint, return static count)
  const PERPLEXITY_API_KEY = getHeaderKey(request, 'perplexity') || getEnvVar(env, 'PERPLEXITY_API_KEY');

  if (PERPLEXITY_API_KEY) {
    counts.perplexity = 3;
  }

  // Cohere
  const COHERE_API_KEY = getHeaderKey(request, 'cohere') || getEnvVar(env, 'COHERE_API_KEY');

  if (COHERE_API_KEY) {
    counts.cohere = await safeFetchCount('https://api.cohere.ai/v1/models', {
      headers: { Authorization: `Bearer ${COHERE_API_KEY}` },
    });
  }

  // Fireworks AI
  const FIREWORKS_API_KEY = getHeaderKey(request, 'fireworks') || getEnvVar(env, 'FIREWORKS_API_KEY');

  if (FIREWORKS_API_KEY) {
    counts.fireworks = await safeFetchCount('https://api.fireworks.ai/inference/v1/models', {
      headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}` },
    });
  }

  // Save cache
  g[cacheKey] = { ts: Date.now(), counts } as CountsCacheEntry;

  return json({ counts, cached: false });
}
