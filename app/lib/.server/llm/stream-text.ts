import { streamText as _streamText, type LanguageModelUsage, type ModelMessage } from 'ai';
import { MAX_TOKENS } from './constants';
import { calculateCost } from './cost-calculator';
import { getBoltSystemPrompt } from './get-system-prompt';
import { DEFAULT_MODEL_ID, DEFAULT_PROVIDER, getDefaultModel, getModel as getModelInfo } from './model-config';
import { createModel } from './provider-factory';
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

  /** Temperature setting (0-1) for response randomness */
  temperature?: number;

  /** Maximum number of tokens in response */
  maxTokens?: number;

  /** Chat mode: normal, plan, or discussion */
  mode?: 'normal' | 'plan' | 'discussion';
}

type UsageMetadata =
  | {
      usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost: number | null;
        provider: AIProvider;
        modelId?: string;
      };
    }
  | undefined;

export type StreamTextReturn = ReturnType<typeof _streamText> & {
  usageMetadata: (args: { part: { type: string; totalUsage?: LanguageModelUsage } }) => UsageMetadata;
};

export function streamText(messages: Messages, env: Env, options?: StreamTextOptions): StreamTextReturn {
  const { provider, modelId, fullModelId, temperature, maxTokens, mode, ...streamOptions } = options || {};

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

  // use user-specified max tokens, model-specific max tokens, or default
  const finalMaxTokens = maxTokens ?? modelInfo?.maxTokens ?? MAX_TOKENS;

  // construct full model ID for prompt builder
  const fullModelIdForPrompt = fullModelId ?? `${resolvedProvider}:${resolvedModelId}`;

  /*
   * optimize temperature based on provider to reduce hallucinations
   * research shows lower temperature (0.3-0.5) reduces package hallucinations for open source models
   */
  const finalTemperature =
    temperature ??
    (resolvedProvider === 'deepseek'
      ? 0.4 // lower temp for DeepSeek reduces 21.7% hallucination rate
      : modelInfo?.isReasoningModel
        ? 0.6 // reasoning models benefit from slightly lower temperature
        : undefined); // use model default for others

  const result = _streamText({
    model,
    system: getBoltSystemPrompt(fullModelIdForPrompt, mode),
    maxOutputTokens: finalMaxTokens,
    temperature: finalTemperature,
    headers,
    messages,
    ...streamOptions,
    onFinish: (result) => {
      streamOptions.onFinish?.(result);
    },
  });

  const usageMetadata = ({ part }: { part: { type: string; totalUsage?: LanguageModelUsage } }): UsageMetadata => {
    if (part.type !== 'finish' || !part.totalUsage) {
      return undefined;
    }

    const inputTokens = part.totalUsage.inputTokens ?? 0;
    const outputTokens = part.totalUsage.outputTokens ?? 0;
    const totalTokens = part.totalUsage.totalTokens ?? inputTokens + outputTokens;

    const cost = modelInfo ? calculateCost(modelInfo, inputTokens, outputTokens) : null;

    return {
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        provider: resolvedProvider,
        modelId: resolvedModelId,
      },
    };
  };

  return Object.assign(result, { usageMetadata });
}
