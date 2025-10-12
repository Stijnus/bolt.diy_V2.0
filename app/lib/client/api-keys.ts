/** Client-side API key storage (localStorage). */
const STORAGE_KEY = 'boltdiy.apiKeys.v1';

export type ProviderKey =
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
  | 'fireworks'
  | 'bedrock';

export function getAllKeys(): Partial<Record<ProviderKey, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as Partial<Record<ProviderKey, string>>) : {};
  } catch {
    return {};
  }
}

export function getKey(provider: ProviderKey): string | undefined {
  return getAllKeys()[provider];
}

export function setKey(provider: ProviderKey, value: string | undefined) {
  const all = getAllKeys();

  if (!value) {
    delete all[provider];
  } else {
    all[provider] = value;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function buildAuthHeaders(keys: Partial<Record<ProviderKey, string>>): HeadersInit {
  const h: Record<string, string> = {};

  for (const [p, v] of Object.entries(keys)) {
    if (!v) {
      continue;
    }

    h[`x-api-key-${p}`] = v as string;
  }

  return h;
}
