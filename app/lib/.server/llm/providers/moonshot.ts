import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const moonshotConfig: ProviderConfig = {
  id: 'moonshot',
  name: 'Moonshot (Kimi)',
  apiKeyEnvVar: 'MOONSHOT_API_KEY',
  models: [
    {
      id: 'moonshot-k1.5-pro',
      name: 'Moonshot K1.5 Pro',
      description: 'Premium Kimi model focused on product design, UX copy, and TypeScript.',
      provider: 'moonshot',
      maxTokens: 8192,
      contextWindow: 160000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 0.72, output: 2.8 },
      isDefault: true,
    },
    {
      id: 'moonshot-k1-flash',
      name: 'Moonshot K1 Flash',
      description: 'Flash tier for rapid iteration with deterministic summaries and planning.',
      provider: 'moonshot',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.28, output: 1.1 },
    },
  ],
};

export const moonshotProvider: Provider = {
  config: moonshotConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.moonshot.ai/v1' });
    const selectedModel = modelId || getDefaultModel('moonshot')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Moonshot');
    }

    return openaiCompat(selectedModel);
  },
};
