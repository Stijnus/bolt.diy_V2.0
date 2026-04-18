import { anthropicConfig, deepseekConfig, googleConfig, openaiConfig, xaiConfig, mistralConfig } from './providers';
import type { AIProvider, ModelInfo, ProviderConfig } from './providers/types';

/**
 * Registry of all available providers.
 */
const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  anthropic: anthropicConfig,
  deepseek: deepseekConfig,
  google: googleConfig,
  openai: openaiConfig,
  xai: xaiConfig,
  mistral: mistralConfig,
};

/**
 * Get models for a specific provider.
 */
function getProviderModels(provider: AIProvider): ModelInfo[] {
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
 * Default provider and model.
 */
export const DEFAULT_PROVIDER: AIProvider = 'anthropic';
export const DEFAULT_MODEL_ID = 'claude-sonnet-4-5-20250929';
