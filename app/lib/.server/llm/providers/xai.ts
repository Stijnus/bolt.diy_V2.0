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
      description: 'Speedy and economical reasoning model excelling at agentic coding. 70.8% on SWE-Bench.',
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
        input: 0.2,
        output: 1.5,
        cachedInput: 0.02,
      },
      isDefault: true,
    },
    {
      id: 'grok-3',
      name: 'Grok 3',
      description: 'Advanced model with significant improvements in reasoning, math, and coding.',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 2,
        output: 10,
      },
    },
    {
      id: 'grok-4',
      name: 'Grok 4',
      description: 'Most intelligent Grok model with native tool use and real-time search.',
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
        input: 5,
        output: 15,
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
