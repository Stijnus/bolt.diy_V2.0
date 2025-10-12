import type { LanguageModel } from 'ai';

/**
 * Supported AI providers for code generation.
 */
export type AIProvider =
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

/**
 * Model capabilities for filtering and display.
 */
export interface ModelCapabilities {
  /** Supports vision/image understanding */
  vision?: boolean;

  /** Supports function/tool calling */
  tools?: boolean;

  /** Advanced reasoning capabilities */
  reasoning?: boolean;

  /** Optimized for fast responses */
  fast?: boolean;

  /** Specialized for coding tasks */
  coding?: boolean;
}

/**
 * Pricing information per model.
 */
export interface ModelPricing {
  /** Cost per 1M input tokens in USD */
  input: number;

  /** Cost per 1M output tokens in USD */
  output: number;

  /** Cost per 1M cached input tokens in USD (if supported) */
  cachedInput?: number;
}

/**
 * Model metadata and configuration.
 */
export interface ModelInfo {
  /** Unique model identifier (e.g., 'claude-sonnet-4.5') */
  id: string;

  /** Human-readable model name */
  name: string;

  /** Model description and use cases */
  description: string;

  /** Provider this model belongs to */
  provider: AIProvider;

  /** Maximum output tokens */
  maxTokens: number;

  /** Context window size */
  contextWindow: number;

  /** Model capabilities */
  capabilities: ModelCapabilities;

  /** Pricing information */
  pricing?: ModelPricing;

  /** Is this the default model for the provider? */
  isDefault?: boolean;

  /**
   * Is this a reasoning model that performs internal chain-of-thought?
   * Reasoning models (o1, o3, DeepSeek R1) require different prompting strategies:
   * - Minimal, concise prompts
   * - No explicit "think step by step" instructions
   * - Fewer or no examples
   * - They perform reasoning internally in <think> tags
   */
  isReasoningModel?: boolean;
}

/**
 * Provider configuration.
 */
export interface ProviderConfig {
  /** Provider identifier */
  id: AIProvider;

  /** Provider display name */
  name: string;

  /** Available models for this provider */
  models: ModelInfo[];

  /** Environment variable name for API key */
  apiKeyEnvVar: string;
}

/**
 * Function signature for creating a model instance.
 */
export type ModelFactory = (apiKey: string, modelId?: string) => LanguageModel;

/**
 * Provider implementation.
 */
export interface Provider {
  config: ProviderConfig;
  createModel: ModelFactory;
}
