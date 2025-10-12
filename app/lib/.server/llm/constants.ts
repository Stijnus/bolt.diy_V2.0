// default max tokens (used when model-specific limit is not available)
export const MAX_TOKENS = 8192;

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

/*
 * model-specific maximum tokens
 * NOTE: Use the actual API model IDs, not shortened names
 */
export const MODEL_MAX_TOKENS: Record<string, number> = {
  // anthropic
  'claude-sonnet-4-5-20250929': 8192,
  'claude-sonnet-4-20250514': 8192,
  'claude-3-5-sonnet-20240620': 8192,

  // openai
  'gpt-4o': 16384,
  'gpt-4o-mini': 12288,
  'gpt-4-turbo': 8192,
  o1: 100000,
  'o1-mini': 65536,

  // google
  'gemini-2.5-ultra': 8192,
  'gemini-2.5-pro': 8192,
  'gemini-2.5-flash': 8192,

  // deepseek
  'deepseek-chat': 8192,
  'deepseek-reasoner': 8192,

  // xai
  'grok-4-fast-reasoning': 8192,
  'grok-4': 8192,
  'grok-code-fast-1-5': 8192,

  // mistral
  'codestral-25.10': 8192,
  'mistral-large-2': 8192,
  'mistral-small-3': 8192,

  // zai
  'glm-4.6-ultra': 8192,
  'glm-4.6': 8192,
  'glm-4.5-flash': 8192,
  'glm-4-plus': 8192,
  'glm-4-air': 4096,

  // qwen
  'qwen2.5-max': 8192,
  'qwen2.5-coder-turbo': 8192,
  'qwen2.5-mini': 4096,

  // moonshot
  'moonshot-k1.5-pro': 8192,
  'moonshot-k1-flash': 8192,

  // cerebras
  'llama3.3-70b': 8192,
  'gemma-3-12b': 8192,
  'mixtral-8x7b-cerebras': 8192,

  // groq
  'mixtral-8x22b': 8192,
  'llama-3.3-70b-versatile': 8192,
  'llama-3.1-8b-instant': 8192,
  'google/gemma-3-12b': 8192,

  // perplexity
  'sonar-pro-2-online': 8192,
  'sonar-lite-2-online': 8192,
  'llama-3.1-405b-offline': 8192,

  // cohere
  'command-r-plus': 4096,
  'command-r-long': 4096,
  'command-r': 4096,
  'command-light': 4096,
  'aya-23': 4096,

  // fireworks
  'accounts/fireworks/models/llama-v3p2-90b-instruct': 8192,
  'accounts/fireworks/models/qwen2p5-coder-72b': 8192,
  'accounts/fireworks/models/deepseek-r1': 8192,
  'accounts/fireworks/models/mamba-3-24b': 8192,
  'accounts/fireworks/models/yi-large': 8192,
};
