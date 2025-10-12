import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

/**
 * GET /api/models/full
 * Returns normalized, per-provider model lists using provider APIs when an API key
 * is available. API keys can come from server env (Cloudflare env or process.env)
 * or from request headers (to support user-provided keys via UI). Headers use the
 * convention: x-api-key-<provider> (e.g., x-api-key-openrouter).
 */

type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'xai'
  | 'mistral'
  | 'zai'
  | 'openrouter'
  | 'qwen'
  | 'moonshot'
  | 'cerebras'
  | 'groq'
  | 'together'
  | 'perplexity'
  | 'cohere'
  | 'fireworks';

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: ProviderId;
  maxTokens: number;
  contextWindow: number;
  capabilities: { vision?: boolean; tools?: boolean; reasoning?: boolean; fast?: boolean; coding?: boolean };
  pricing?: { input: number; output: number; cachedInput?: number };
  isDefault?: boolean;
}

const DEFAULTS = {
  maxTokens: 8192,
  contextWindow: 128_000,
  capabilities: { tools: true, coding: true },
} as const;

function getEnvVar(env: any, key: string): string | undefined {
  return env?.[key] || process.env[key];
}

function getHeaderKey(request: Request, provider: ProviderId): string | undefined {
  const h = request.headers;
  return (h.get(`x-api-key-${provider}`) || // preferred
    h.get(`${provider}-api-key`) || // fallback
    undefined) as string | undefined;
}

function resolveKey(env: any, request: Request, provider: ProviderId): string | undefined {
  switch (provider) {
    case 'openrouter': {
      return getHeaderKey(request, 'openrouter') || getEnvVar(env, 'OPENROUTER_API_KEY');
    }
    case 'qwen': {
      return getHeaderKey(request, 'qwen') || getEnvVar(env, 'DASHSCOPE_API_KEY');
    }
    case 'moonshot': {
      return getHeaderKey(request, 'moonshot') || getEnvVar(env, 'MOONSHOT_API_KEY');
    }
    case 'cerebras': {
      return getHeaderKey(request, 'cerebras') || getEnvVar(env, 'CEREBRAS_API_KEY');
    }
    case 'deepseek': {
      return getHeaderKey(request, 'deepseek') || getEnvVar(env, 'DEEPSEEK_API_KEY');
    }
    case 'xai': {
      return getHeaderKey(request, 'xai') || getEnvVar(env, 'XAI_API_KEY');
    }
    case 'mistral': {
      return getHeaderKey(request, 'mistral') || getEnvVar(env, 'MISTRAL_API_KEY');
    }
    case 'google': {
      return getHeaderKey(request, 'google') || getEnvVar(env, 'GOOGLE_API_KEY');
    }
    case 'openai': {
      return getHeaderKey(request, 'openai') || getEnvVar(env, 'OPENAI_API_KEY');
    }
    case 'anthropic': {
      return getHeaderKey(request, 'anthropic') || getEnvVar(env, 'ANTHROPIC_API_KEY');
    }
    case 'zai': {
      return getHeaderKey(request, 'zai') || getEnvVar(env, 'ZAI_API_KEY');
    }
    case 'groq': {
      return getHeaderKey(request, 'groq') || getEnvVar(env, 'GROQ_API_KEY');
    }
    case 'together': {
      return getHeaderKey(request, 'together') || getEnvVar(env, 'TOGETHER_API_KEY');
    }
    case 'perplexity': {
      return getHeaderKey(request, 'perplexity') || getEnvVar(env, 'PERPLEXITY_API_KEY');
    }
    case 'cohere': {
      return getHeaderKey(request, 'cohere') || getEnvVar(env, 'COHERE_API_KEY');
    }
    case 'fireworks': {
      return getHeaderKey(request, 'fireworks') || getEnvVar(env, 'FIREWORKS_API_KEY');
    }
    default: {
      return undefined;
    }
  }
}

async function safeList(url: string, init?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, init);

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

function normalize(provider: ProviderId, raw: any): ModelInfo[] {
  if (!raw) {
    return [];
  }

  // common shapes
  const dataArr = Array.isArray(raw?.data) ? raw.data : undefined;
  const modelsArr = Array.isArray(raw?.models) ? raw.models : undefined;
  const rootArr = Array.isArray(raw) ? raw : undefined;

  const items: any[] = dataArr || modelsArr || rootArr || [];

  function toId(x: any): string | undefined {
    if (!x) {
      return undefined;
    }

    if (typeof x === 'string') {
      return x;
    }

    if (x.id) {
      return String(x.id);
    }

    if (x.name) {
      // Google: name like "models/gemini-2.5-pro"
      const name: string = String(x.name);
      return name.startsWith('models/') ? name.slice('models/'.length) : name;
    }

    return undefined;
  }

  return items
    .map((x) => toId(x))
    .filter((id): id is string => !!id)
    .map((id) => ({
      id,
      name: id,
      description: `${provider} model ${id}`,
      provider,
      maxTokens: DEFAULTS.maxTokens,
      contextWindow: DEFAULTS.contextWindow,
      capabilities: { ...DEFAULTS.capabilities },
    }));
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const env = (context as any)?.cloudflare?.env as any;

  const providers: ProviderId[] = [
    'anthropic',
    'openai',
    'openrouter',
    'qwen',
    'moonshot',
    'cerebras',
    'deepseek',
    'xai',
    'mistral',
    'google',
    'groq',
    'together',
    'perplexity',
    'cohere',
    'fireworks',
  ];

  const results: Record<string, ModelInfo[]> = {};

  await Promise.all(
    providers.map(async (p) => {
      const key = resolveKey(env, request, p);

      if (!key) {
        return;
      }

      try {
        switch (p) {
          case 'anthropic': {
            // Anthropic has no public list endpoint, return static models
            results[p] = [
              {
                id: 'claude-sonnet-4-5-20250929',
                name: 'Claude Sonnet 4.5',
                description: 'Best overall coding model with 30+ hour autonomy',
                provider: 'anthropic',
                maxTokens: 8192,
                contextWindow: 200000,
                capabilities: { vision: true, tools: true, reasoning: true, coding: true },
                pricing: { input: 3, output: 15 },
                isDefault: true,
              },
              {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude Sonnet 4',
                description: 'Previous generation, highly capable',
                provider: 'anthropic',
                maxTokens: 8192,
                contextWindow: 200000,
                capabilities: { vision: true, tools: true, coding: true },
                pricing: { input: 3, output: 15 },
              },
              {
                id: 'claude-3-5-sonnet-20240620',
                name: 'Claude 3.5 Sonnet (Legacy)',
                description: 'Legacy model kept for backward compatibility',
                provider: 'anthropic',
                maxTokens: 8192,
                contextWindow: 200000,
                capabilities: { vision: true, tools: true, coding: true },
                pricing: { input: 3, output: 15 },
              },
            ];
            break;
          }
          case 'openai': {
            // Try to fetch OpenAI models, but fallback to static list on error
            try {
              const raw = await safeList('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
              });

              if (raw) {
                results[p] = normalize(p, raw);
              } else {
                throw new Error('OpenAI API returned no data');
              }
            } catch {
              // Fallback to static models
              results[p] = [
                {
                  id: 'gpt-5',
                  name: 'GPT-5',
                  description: 'Smartest model with built-in thinking',
                  provider: 'openai',
                  maxTokens: 16384,
                  contextWindow: 128000,
                  capabilities: { vision: true, tools: true, reasoning: true, coding: true },
                  pricing: { input: 5, output: 15 },
                  isDefault: true,
                },
                {
                  id: 'gpt-4.1',
                  name: 'GPT-4.1',
                  description: 'Specialized for coding tasks',
                  provider: 'openai',
                  maxTokens: 8192,
                  contextWindow: 128000,
                  capabilities: { vision: true, tools: true, coding: true },
                  pricing: { input: 3, output: 12 },
                },
                {
                  id: 'o3',
                  name: 'OpenAI o3',
                  description: 'Advanced reasoning model',
                  provider: 'openai',
                  maxTokens: 100000,
                  contextWindow: 128000,
                  capabilities: { tools: true, reasoning: true, coding: true },
                  pricing: { input: 10, output: 40 },
                },
                {
                  id: 'o4-mini',
                  name: 'OpenAI o4-mini',
                  description: 'Fast, cost-efficient reasoning model',
                  provider: 'openai',
                  maxTokens: 65536,
                  contextWindow: 128000,
                  capabilities: { tools: true, reasoning: true, coding: true, fast: true },
                  pricing: { input: 1.1, output: 4.4 },
                },
                {
                  id: 'gpt-4o',
                  name: 'GPT-4o',
                  description: 'Multimodal model with strong general capabilities',
                  provider: 'openai',
                  maxTokens: 16384,
                  contextWindow: 128000,
                  capabilities: { vision: true, tools: true, coding: true },
                  pricing: { input: 2.5, output: 10 },
                },
              ];
            }
            break;
          }
          case 'openrouter': {
            const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
            const orRef = getEnvVar(env, 'OPENROUTER_APP_REFERRER');
            const orTitle = getEnvVar(env, 'OPENROUTER_APP_TITLE');

            if (orRef) {
              headers['HTTP-Referer'] = orRef;
            }

            if (orTitle) {
              headers['X-Title'] = orTitle;
            }

            const raw = await safeList('https://openrouter.ai/api/v1/models', { headers });
            results[p] = normalize(p, raw);
            break;
          }
          case 'qwen': {
            const raw = await safeList('https://dashscope.aliyuncs.com/compatible-mode/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'moonshot': {
            const raw = await safeList('https://api.moonshot.ai/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'cerebras': {
            const raw = await safeList('https://api.cerebras.ai/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'deepseek': {
            const raw = await safeList('https://api.deepseek.com/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'xai': {
            const raw = await safeList('https://api.x.ai/v1/language-models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'mistral': {
            const raw = await safeList('https://api.mistral.ai/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'google': {
            const raw = await safeList(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
            results[p] = normalize(p, raw);
            break;
          }
          case 'groq': {
            const raw = await safeList('https://api.groq.com/openai/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'together': {
            const raw = await safeList('https://api.together.xyz/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'perplexity': {
            // Perplexity has no public list endpoint, return static models
            results[p] = [
              {
                id: 'llama-3.1-sonar-large-128k-online',
                name: 'Sonar Large Online',
                description: 'Search-augmented model with web access',
                provider: 'perplexity',
                maxTokens: 8192,
                contextWindow: 128000,
                capabilities: { tools: true, coding: true, reasoning: true },
                pricing: { input: 1, output: 1 },
                isDefault: true,
              },
              {
                id: 'llama-3.1-sonar-small-128k-online',
                name: 'Sonar Small Online',
                description: 'Fast search-augmented model',
                provider: 'perplexity',
                maxTokens: 8192,
                contextWindow: 128000,
                capabilities: { tools: true, coding: true, fast: true },
                pricing: { input: 0.2, output: 0.2 },
              },
              {
                id: 'llama-3.1-sonar-huge-128k-online',
                name: 'Sonar Huge Online',
                description: 'Most capable search model',
                provider: 'perplexity',
                maxTokens: 8192,
                contextWindow: 128000,
                capabilities: { tools: true, coding: true, reasoning: true },
                pricing: { input: 5, output: 5 },
              },
              {
                id: 'llama-3.1-8b-instruct',
                name: 'Llama 3.1 8B',
                description: 'Fast offline model',
                provider: 'perplexity',
                maxTokens: 8192,
                contextWindow: 128000,
                capabilities: { tools: true, coding: true, fast: true },
                pricing: { input: 0.2, output: 0.2 },
              },
              {
                id: 'llama-3.1-70b-instruct',
                name: 'Llama 3.1 70B',
                description: 'Powerful offline model',
                provider: 'perplexity',
                maxTokens: 8192,
                contextWindow: 128000,
                capabilities: { tools: true, coding: true },
                pricing: { input: 1, output: 1 },
              },
            ];
            break;
          }
          case 'cohere': {
            const raw = await safeList('https://api.cohere.ai/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
          case 'fireworks': {
            const raw = await safeList('https://api.fireworks.ai/inference/v1/models', {
              headers: { Authorization: `Bearer ${key}` },
            });
            results[p] = normalize(p, raw);
            break;
          }
        }
      } catch {
        // ignore provider on error
      }
    }),
  );

  return json({ modelsByProvider: results });
}
