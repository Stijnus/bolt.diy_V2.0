import { createXai } from '@ai-sdk/xai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const xaiConfig: ProviderConfig = {
  id: 'xai',
  name: 'xAI',
  apiKeyEnvVar: 'XAI_API_KEY',
  models: [
    {
      id: 'grok-4-fast',
      name: 'Grok 4 Fast',
      description: 'Unified reasoning model with 2M context. 40% fewer tokens, 98% cheaper than Grok 4.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 2000000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.2,
        output: 0.5,
        cachedInput: 0.05,
      },
      isDefault: true,
      isReasoningModel: true,
    },
    {
      id: 'grok-4',
      name: 'Grok 4',
      description: 'Full-strength reasoning model with real-time search and advanced multimodal capabilities.',
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
      description: 'Specialized for code reviews, refactors, and iterative development. Fast and affordable.',
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
