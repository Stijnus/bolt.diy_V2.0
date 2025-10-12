import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const qwenConfig: ProviderConfig = {
  id: 'qwen',
  name: 'Qwen (DashScope)',
  apiKeyEnvVar: 'DASHSCOPE_API_KEY',
  models: [
    {
      id: 'qwen2.5-max',
      name: 'Qwen2.5 Max',
      description: 'Newest Alibaba flagship with dual-language reasoning and 1.5M context in streaming mode.',
      provider: 'qwen',
      maxTokens: 8192,
      contextWindow: 1536000,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 1.4, output: 5.6 },
      isDefault: true,
    },
    {
      id: 'qwen2.5-coder-turbo',
      name: 'Qwen2.5 Coder Turbo',
      description: 'High-throughput coder tuned for TypeScript, Java, and Python repositories.',
      provider: 'qwen',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.62, output: 2.3 },
    },
    {
      id: 'qwen2.5-mini',
      name: 'Qwen2.5 Mini',
      description: 'Cost-effective assistant for agents and background jobs.',
      provider: 'qwen',
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.12, output: 0.38 },
    },
  ],
};

export const qwenProvider: Provider = {
  config: qwenConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' });
    const selectedModel = modelId || getDefaultModel('qwen')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Qwen');
    }

    return openaiCompat(selectedModel);
  },
};
