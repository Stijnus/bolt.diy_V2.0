import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const cerebrasConfig: ProviderConfig = {
  id: 'cerebras',
  name: 'Cerebras',
  apiKeyEnvVar: 'CEREBRAS_API_KEY',
  models: [
    {
      id: 'llama3.3-70b',
      name: 'Llama 3.3 70B (Cerebras)',
      description: 'Latest Llama 3.3 hosted on Cerebras accelerators with blazing inference speeds.',
      provider: 'cerebras',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.58, output: 0.58 },
      isDefault: true,
    },
    {
      id: 'gemma-3-12b',
      name: 'Gemma 3 12B (Cerebras)',
      description: 'Google Gemma 3 mid-tier optimized for UI copy, docs, and lightweight agents.',
      provider: 'cerebras',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.22, output: 0.22 },
    },
    {
      id: 'mixtral-8x7b-cerebras',
      name: 'Mixtral 8x7B (Cerebras)',
      description: 'Hosted Mixtral with accelerator-friendly MoE routing for parallel workloads.',
      provider: 'cerebras',
      maxTokens: 8192,
      contextWindow: 32768,
      capabilities: { tools: true, coding: true },
      pricing: { input: 0.34, output: 0.34 },
    },
  ],
};

export const cerebrasProvider: Provider = {
  config: cerebrasConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.cerebras.ai/v1' });
    const selectedModel = modelId || getDefaultModel('cerebras')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Cerebras');
    }

    return openaiCompat(selectedModel);
  },
};
