import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { createModel, getDefaultModelInstance } from './provider-factory';
import type { AIProvider } from './providers/types';

/**
 * Get Anthropic model (legacy, for backward compatibility).
 *
 * @deprecated Use getModel instead.
 */
export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

/**
 * Get a model instance based on provider and model ID.
 *
 * @param env - Cloudflare environment object.
 * @param provider - AI provider (anthropic, openai, google, etc.).
 * @param modelId - Specific model ID (optional, uses provider default).
 * @returns LanguageModel instance.
 */
export function getModel(env: Env, provider?: AIProvider, modelId?: string): LanguageModel {
  if (!provider) {
    return getDefaultModelInstance(env);
  }

  return createModel(provider, modelId, env);
}

/**
 * Get model from full ID (provider:modelId format).
 *
 * @param env - Cloudflare environment object.
 * @param fullId - Full model ID in format "provider:modelId" (e.g., "anthropic:claude-sonnet-4.5").
 * @returns LanguageModel instance.
 */
export function getModelFromFullId(env: Env, fullId?: string): LanguageModel {
  if (!fullId) {
    return getDefaultModelInstance(env);
  }

  const [provider, modelId] = fullId.split(':') as [AIProvider, string];

  return createModel(provider, modelId, env);
}
