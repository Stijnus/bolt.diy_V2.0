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

  // DeepSeek
  const DEEPSEEK_API_KEY = getHeaderKey(request, 'deepseek') || getEnvVar(env, 'DEEPSEEK_API_KEY');

  if (DEEPSEEK_API_KEY) {
    counts.deepseek = 2; // deepseek-chat, deepseek-reasoner
  }

  // xAI (Grok) - dynamically fetch model count
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

  // ZAI (GLM)

  const ZAI_API_KEY = getHeaderKey(request, 'zai') || getEnvVar(env, 'ZAI_API_KEY');

  if (ZAI_API_KEY) {
    // Static count aligned with our curated MODELS.zai list
    counts.zai = 5;
  }

  // Google Gemini (API key in query)
  const GOOGLE_API_KEY = getHeaderKey(request, 'google') || getEnvVar(env, 'GOOGLE_API_KEY');

  if (GOOGLE_API_KEY) {
    counts.google = await safeFetchCount(`https://generativelanguage.googleapis.com/v1/models?key=${GOOGLE_API_KEY}`);
  }

  /*
   * Anthropic & OpenAI have no public list-models endpoints, but we can return
   * static counts based on our known model configurations when API keys are present.
   */

  // Anthropic - return static count of 5 models (Claude Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 4, 3.5 Sonnet Legacy)
  const ANTHROPIC_API_KEY = getHeaderKey(request, 'anthropic') || getEnvVar(env, 'ANTHROPIC_API_KEY');

  if (ANTHROPIC_API_KEY) {
    counts.anthropic = 5;
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

  // Save cache
  g[cacheKey] = { ts: Date.now(), counts } as CountsCacheEntry;

  return json({ counts, cached: false });
}
