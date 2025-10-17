import { createXai } from '@ai-sdk/xai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const xaiConfig: ProviderConfig = {
  id: 'xai',
  name: 'xAI',
  apiKeyEnvVar: 'XAI_API_KEY',
  models: [
    {
      id: 'grok-code-fast-1',
      name: 'Grok Code Fast 1',
      description: 'Specialized for code reviews, refactors, and iterative development. Lightning fast and low cost.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.2,
        output: 1.5,
      },
    },
    {
      id: 'grok-4-fast-reasoning',
      name: 'Grok 4 Fast (Reasoning)',
      description: 'Latest reasoning model with 2M context. Fast, cost-efficient reasoning capabilities.',
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
      },
      isDefault: true,
      isReasoningModel: true,
    },
    {
      id: 'grok-4-fast-non-reasoning',
      name: 'Grok 4 Fast (Non-Reasoning)',
      description: 'Fast model without reasoning capabilities. 2M context window.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 2000000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.2,
        output: 0.5,
      },
    },
    {
      id: 'grok-4-0709',
      name: 'Grok 4',
      description: 'Full-strength reasoning model with advanced capabilities.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 3.0,
        output: 15.0,
      },
    },
    {
      id: 'grok-3-mini',
      name: 'Grok 3 Mini',
      description: 'Lightweight and cost-efficient model for quick tasks.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        coding: true,
      },
      pricing: {
        input: 0.3,
        output: 0.5,
      },
    },
    {
      id: 'grok-3',
      name: 'Grok 3',
      description: 'Previous generation model with robust capabilities.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        tools: true,
        coding: true,
      },
      pricing: {
        input: 3.0,
        output: 15.0,
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
