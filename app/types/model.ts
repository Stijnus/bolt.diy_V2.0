/**
 * Frontend types for AI model selection and configuration.
 */

export type AIProvider = 'anthropic' | 'openai' | 'google' | 'deepseek' | 'xai' | 'mistral';

export interface ModelCapabilities {
  vision?: boolean;
  tools?: boolean;
  reasoning?: boolean;
  fast?: boolean;
  coding?: boolean;
}

export interface ModelPricing {
  input: number;
  output: number;
  cachedInput?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: AIProvider;
  maxTokens: number;
  contextWindow: number;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  isDefault?: boolean;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  models: ModelInfo[];
}

/**
 * Full model identifier in format "provider:modelId".
 */
export type FullModelId = `${AIProvider}:${string}`;

/**
 * Model selection state.
 */
export interface ModelSelection {
  provider: AIProvider;
  modelId: string;
  fullId: FullModelId;
}
