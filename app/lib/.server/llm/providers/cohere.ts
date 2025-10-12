import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const cohereConfig: ProviderConfig = {
  id: 'cohere',
  name: 'Cohere',
  apiKeyEnvVar: 'COHERE_API_KEY',
  models: [
    {
      id: 'command-r-plus',
      name: 'Command R+',
      description: 'Most capable model for complex tasks and RAG',
      provider: 'cohere',
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 3, output: 15 },
      isDefault: true,
    },
    {
      id: 'command-r-long',
      name: 'Command R Long',
      description: 'Extended-context Command variant with 1M token intake for document workflows.',
      provider: 'cohere',
      maxTokens: 4096,
      contextWindow: 1000000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 1.8, output: 6.2 },
    },
    {
      id: 'command-r',
      name: 'Command R',
      description: 'Balanced model for general tasks',
      provider: 'cohere',
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true },
      pricing: { input: 0.5, output: 1.5 },
    },
    {
      id: 'command-light',
      name: 'Command Light',
      description: 'Ultra-fast lightweight model',
      provider: 'cohere',
      maxTokens: 4096,
      contextWindow: 4096,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.3, output: 0.6 },
    },
    {
      id: 'aya-23',
      name: 'Aya 23',
      description: 'Open Aya release from Cohere For AI for multilingual experimentation.',
      provider: 'cohere',
      maxTokens: 4096,
      contextWindow: 200000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 0.0, output: 0.0 },
    },
  ],
};

export const cohereProvider: Provider = {
  config: cohereConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.cohere.ai/compatibility/v1' });
    const selectedModel = modelId || getDefaultModel('cohere')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Cohere');
    }

    return openaiCompat(selectedModel);
  },
};
