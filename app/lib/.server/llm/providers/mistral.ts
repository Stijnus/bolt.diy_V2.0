import { createMistral } from '@ai-sdk/mistral';
import type { Provider, ProviderConfig } from './types';

export const mistralConfig: ProviderConfig = {
  id: 'mistral',
  name: 'Mistral',
  apiKeyEnvVar: 'MISTRAL_API_KEY',
  models: [
    {
      id: 'codestral-latest',
      name: 'Codestral 25.08',
      description: 'Optimized for low-latency coding. 2x faster with 80+ programming languages support.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.3,
        output: 0.9,
      },
      isDefault: true,
    },
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      description: 'General-purpose flagship model with strong coding capabilities.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 2,
        output: 6,
      },
    },
    {
      id: 'mistral-small-latest',
      name: 'Mistral Small',
      description: 'Fast and cost-effective model for simple coding tasks.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 32000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.2,
        output: 0.6,
      },
    },
  ],
};

export const mistralProvider: Provider = {
  config: mistralConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const mistral = createMistral({ apiKey });
    const selectedModel = modelId || 'codestral-latest';

    return mistral(selectedModel);
  },
};
