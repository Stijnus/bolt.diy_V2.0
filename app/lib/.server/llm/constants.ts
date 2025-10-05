// default max tokens (used when model-specific limit is not available)
export const MAX_TOKENS = 8192;

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

// model-specific maximum tokens
// NOTE: Use the actual API model IDs, not shortened names
export const MODEL_MAX_TOKENS: Record<string, number> = {
  // anthropic
  'claude-sonnet-4-5-20250929': 8192,
  'claude-sonnet-4-20250514': 8192,
  'claude-3-5-sonnet-20240620': 8192,

  // openai
  'gpt-5': 16384,
  'gpt-4.1': 8192,
  o3: 100000,
  'o4-mini': 65536,
  'gpt-4o': 16384,

  // google
  'gemini-2.5-pro': 8192,
  'gemini-2.5-flash': 8192,
  'gemini-exp-1206': 8192,

  // deepseek
  'deepseek-chat': 8192,
  'deepseek-reasoner': 8192,

  // xai
  'grok-code-fast-1': 8192,
  'grok-3': 8192,
  'grok-4': 8192,

  // mistral
  'codestral-latest': 8192,
  'mistral-large-latest': 8192,
  'mistral-small-latest': 8192,
};
