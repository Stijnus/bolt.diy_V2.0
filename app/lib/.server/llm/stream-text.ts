import { streamText as _streamText, type ModelMessage, type StreamTextResult } from 'ai';
import { MAX_TOKENS } from './constants';
import { calculateCost } from './cost-calculator';
import {
  DEFAULT_MODEL_ID,
  DEFAULT_PROVIDER,
  getDefaultModel,
  getModel as getModelInfo,
} from './model-config';
import { createModel } from './provider-factory';
import { getSystemPrompt } from './prompts';
import type { AIProvider } from './providers/types';

export type Messages = ModelMessage[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model' | 'messages' | 'prompt'>;

export interface StreamTextOptions extends StreamingOptions {
  /** AI provider to use (defaults to anthropic) */
  provider?: AIProvider;

  /** Specific model ID to use (defaults to provider's default model) */
  modelId?: string;

  /** Full model ID in format "provider:modelId" (overrides provider and modelId) */
  fullModelId?: string;
}

export function streamText(
  messages: Messages,
  env: Env,
  options?: StreamTextOptions,
): StreamTextResult<any> {
  const { provider, modelId, fullModelId, ...streamOptions } = options || {};

  // determine which model to use
  let selectedProvider = provider;
  let selectedModelId = modelId;

  if (fullModelId) {
    // parse full model ID format (e.g., "anthropic:claude-sonnet-4.5")
    const [p, m] = fullModelId.split(':') as [AIProvider, string];
    selectedProvider = p;
    selectedModelId = m;
  }

  const resolvedProvider = selectedProvider ?? DEFAULT_PROVIDER;

  const resolvedModelId =
    selectedModelId ??
    getDefaultModel(resolvedProvider)?.id ??
    (resolvedProvider === DEFAULT_PROVIDER ? DEFAULT_MODEL_ID : undefined);

  const model = createModel(resolvedProvider, resolvedModelId, env);

  const modelInfo = resolvedModelId ? getModelInfo(resolvedProvider, resolvedModelId) : undefined;

  // apply provider-specific headers and configuration
  const headers: Record<string, string> = {};

  if (resolvedProvider === 'anthropic') {
    headers['anthropic-beta'] = 'max-tokens-3-5-sonnet-2024-07-15';
  }

  // use model-specific max tokens if available, otherwise use default
  const maxTokens = modelInfo?.maxTokens || MAX_TOKENS;

  return _streamText({
    model,
    system: getSystemPrompt(),
    maxTokens,
    headers,
    messages,
    ...streamOptions,
    onFinish: (result) => {
      // Calculate cost on finish
      if (modelInfo) {
        const cost = calculateCost(modelInfo, result.usage.promptTokens, result.usage.completionTokens);
        // Extend the result with custom usage data
        Object.assign(result.usage, { cost, provider: resolvedProvider, modelId: resolvedModelId });
      }
      // call original onFinish if it exists
      streamOptions.onFinish?.(result);
    },
  });
}
