import type { LanguageModel } from 'ai';
import { DEFAULT_PROVIDER, getModel } from './model-config';
import {
  anthropicProvider,
  deepseekProvider,
  googleProvider,
  openaiProvider,
  xaiProvider,
  mistralProvider,
} from './providers';
import type { AIProvider } from './providers/types';

/**
 * Registry of provider factory functions.
 */
const PROVIDERS = {
  anthropic: anthropicProvider,
  deepseek: deepseekProvider,
  google: googleProvider,
  openai: openaiProvider,
  xai: xaiProvider,
  mistral: mistralProvider,
} as const;

/**
 * Get API key for a specific provider from environment.
 */
function getProviderApiKey(provider: AIProvider, env: Env): string | undefined {
  const providerConfig = PROVIDERS[provider]?.config;

  if (!providerConfig) {
    return undefined;
  }

  const envVar = providerConfig.apiKeyEnvVar;

  // try Cloudflare env first, then process.env
  return (env as any)[envVar] || process.env[envVar];
}

/**
 * Create a model instance for the specified provider and model.
 */
export function createModel(provider: AIProvider = DEFAULT_PROVIDER, modelId?: string, env?: Env): LanguageModel {
  const providerImpl = PROVIDERS[provider];

  if (!providerImpl) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // get API key from environment
  const apiKey = env ? getProviderApiKey(provider, env) : undefined;

  if (!apiKey) {
    throw new Error(
      `Missing API key for provider ${provider}. Please set ${providerImpl.config.apiKeyEnvVar} in your environment.`,
    );
  }

  // validate model ID if provided
  if (modelId) {
    const modelInfo = getModel(provider, modelId);

    if (!modelInfo) {
      console.warn(`Model ${modelId} not found for provider ${provider}. Using default.`);
      modelId = undefined;
    }
  }

  // create and return the model
  return providerImpl.createModel(apiKey, modelId);
}
