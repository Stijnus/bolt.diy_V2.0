import {
  anthropicConfig,
  deepseekConfig,
  googleConfig,
  openaiConfig,
  xaiConfig,
  mistralConfig,
  zaiConfig,
  openrouterConfig,
  qwenConfig,
  moonshotConfig,
  cerebrasConfig,
  groqConfig,
  togetherConfig,
  perplexityConfig,
  cohereConfig,
  fireworksConfig,
} from './providers';
import type { AIProvider, ModelInfo, ProviderConfig } from './providers/types';

/**
 * Registry of all available providers.
 */
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  anthropic: anthropicConfig,
  deepseek: deepseekConfig,
  google: googleConfig,
  openai: openaiConfig,
  xai: xaiConfig,
  mistral: mistralConfig,
  zai: zaiConfig,
  openrouter: openrouterConfig,
  qwen: qwenConfig,
  moonshot: moonshotConfig,
  cerebras: cerebrasConfig,
  groq: groqConfig,
  together: togetherConfig,
  perplexity: perplexityConfig,
  cohere: cohereConfig,
  fireworks: fireworksConfig,
};

/**
 * Get all available models across all providers.
 */
export function getAllModels(): ModelInfo[] {
  return Object.values(PROVIDER_CONFIGS).flatMap((config) => config.models);
}

/**
 * Get models for a specific provider.
 */
export function getProviderModels(provider: AIProvider): ModelInfo[] {
  return PROVIDER_CONFIGS[provider]?.models || [];
}

/**
 * Get a specific model by provider and model ID.
 */
export function getModel(provider: AIProvider, modelId: string): ModelInfo | undefined {
  const models = getProviderModels(provider);
  return models.find((m) => m.id === modelId);
}

/**
 * Get the default model for a provider.
 */
export function getDefaultModel(provider: AIProvider): ModelInfo | undefined {
  const models = getProviderModels(provider);
  return models.find((m) => m.isDefault) || models[0];
}

/**
 * Get model by full ID (provider:modelId format).
 */
export function getModelByFullId(fullId: string): ModelInfo | undefined {
  const [provider, modelId] = fullId.split(':') as [AIProvider, string];

  if (!provider || !modelId) {
    return undefined;
  }

  return getModel(provider, modelId);
}

/**
 * Get all providers.
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

/**
 * Get provider by ID.
 */
export function getProvider(provider: AIProvider): ProviderConfig | undefined {
  return PROVIDER_CONFIGS[provider];
}

/**
 * Default provider and model.
 */
export const DEFAULT_PROVIDER: AIProvider = 'deepseek';
export const DEFAULT_MODEL_ID = 'deepseek-chat';
