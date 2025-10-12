import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const togetherConfig: ProviderConfig = {
  id: 'together',
  name: 'Together AI',
  apiKeyEnvVar: 'TOGETHER_API_KEY',
  models: [
    {
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      name: 'Llama 3.1 70B Turbo',
      description: 'Fast inference for Llama 3.1 70B',
      provider: 'together',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.88, output: 0.88 },
      isDefault: true,
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      name: 'Llama 3.1 8B Turbo',
      description: 'Ultra-fast 8B model for quick tasks',
      provider: 'together',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.18, output: 0.18 },
    },
    {
      id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      name: 'Mixtral 8x7B',
      description: 'Mixture of experts model from Mistral',
      provider: 'together',
      maxTokens: 8192,
      contextWindow: 32768,
      capabilities: { tools: true, coding: true },
      pricing: { input: 0.6, output: 0.6 },
    },
    {
      id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      name: 'Qwen 2.5 72B Turbo',
      description: 'Alibaba Qwen model optimized for coding',
      provider: 'together',
      maxTokens: 8192,
      contextWindow: 32768,
      capabilities: { tools: true, coding: true },
      pricing: { input: 1.2, output: 1.2 },
    },
    {
      id: 'deepseek-ai/deepseek-coder-33b-instruct',
      name: 'DeepSeek Coder 33B',
      description: 'Specialized coding model',
      provider: 'together',
      maxTokens: 8192,
      contextWindow: 16384,
      capabilities: { tools: true, coding: true },
      pricing: { input: 0.8, output: 0.8 },
    },
  ],
};

export const togetherProvider: Provider = {
  config: togetherConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.together.xyz/v1' });
    const selectedModel = modelId || getDefaultModel('together')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Together AI');
    }

    return openaiCompat(selectedModel);
  },
};
