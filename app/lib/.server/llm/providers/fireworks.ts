import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const fireworksConfig: ProviderConfig = {
  id: 'fireworks',
  name: 'Fireworks AI',
  apiKeyEnvVar: 'FIREWORKS_API_KEY',
  models: [
    {
      id: 'accounts/fireworks/models/llama-v3p2-90b-instruct',
      name: 'Llama 3.2 90B',
      description: 'Fireworks-hosted Llama with 90B active params and near-cost parity to 70B.',
      provider: 'fireworks',
      maxTokens: 8192,
      contextWindow: 160000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.88, output: 0.88 },
      isDefault: true,
    },
    {
      id: 'accounts/fireworks/models/qwen2p5-coder-72b',
      name: 'Qwen2.5 Coder 72B',
      description: 'Alibaba coder giant optimized for Fireworks inference stack.',
      provider: 'fireworks',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 0.95, output: 0.95 },
    },
    {
      id: 'accounts/fireworks/models/deepseek-r1',
      name: 'DeepSeek R1 (Fireworks)',
      description: 'Hosted DeepSeek reasoning model with managed tool-calling and caching.',
      provider: 'fireworks',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: { tools: true, reasoning: true, coding: true },
      pricing: { input: 0.92, output: 0.92 },
      isReasoningModel: true,
    },
    {
      id: 'accounts/fireworks/models/mamba-3-24b',
      name: 'Mamba 3 24B',
      description: 'State-space model ideal for streaming data, logs, and telemetry summaries.',
      provider: 'fireworks',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.42, output: 0.42 },
    },
    {
      id: 'accounts/fireworks/models/yi-large',
      name: 'Yi Large',
      description: '01.AI flagship model',
      provider: 'fireworks',
      maxTokens: 8192,
      contextWindow: 32768,
      capabilities: { tools: true, coding: true },
      pricing: { input: 3, output: 3 },
    },
  ],
};

export const fireworksProvider: Provider = {
  config: fireworksConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.fireworks.ai/inference/v1' });
    const selectedModel = modelId || getDefaultModel('fireworks')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Fireworks AI');
    }

    return openaiCompat(selectedModel);
  },
};
