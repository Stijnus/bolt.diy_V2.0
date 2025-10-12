import { createXai } from '@ai-sdk/xai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const xaiConfig: ProviderConfig = {
  id: 'xai',
  name: 'xAI',
  apiKeyEnvVar: 'XAI_API_KEY',
  models: [
    {
      id: 'grok-4-fast-reasoning',
      name: 'Grok 4 Fast Reasoning',
      description: 'Low-latency Grok 4 tier with upgraded tool use and 4x cheaper thinking bursts.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.35,
        output: 1.8,
        cachedInput: 0.035,
      },
      isDefault: true,
      isReasoningModel: true,
    },
    {
      id: 'grok-4',
      name: 'Grok 4',
      description: 'Full-strength Grok model with integrated real-time search and GPU-native tools.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 4.5,
        output: 13.5,
      },
    },
    {
      id: 'grok-code-fast-1-5',
      name: 'Grok Code Fast 1.5',
      description: 'Iterative coding specialist ideal for refactors, pull-request reviews, and agent work.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.22,
        output: 1.6,
        cachedInput: 0.022,
      },
    },
  ],
};

export const xaiProvider: Provider = {
  config: xaiConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const xai = createXai({ apiKey });
    const selectedModel = modelId || getDefaultModel('xai')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for xAI');
    }

    return xai(selectedModel);
  },
};
