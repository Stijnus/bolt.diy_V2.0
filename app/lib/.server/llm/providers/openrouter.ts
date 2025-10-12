import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const openrouterConfig: ProviderConfig = {
  id: 'openrouter',
  name: 'OpenRouter',
  apiKeyEnvVar: 'OPENROUTER_API_KEY',
  models: [
    {
      id: 'openrouter/auto',
      name: 'OpenRouter Auto',
      description: 'Router that selects an appropriate upstream model automatically.',
      provider: 'openrouter',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true },
      pricing: { input: 0, output: 0 },
      isDefault: true,
    },
  ],
};

export const openrouterProvider: Provider = {
  config: openrouterConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    const selectedModel = modelId || getDefaultModel('openrouter')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for OpenRouter');
    }

    return openaiCompat(selectedModel);
  },
};
