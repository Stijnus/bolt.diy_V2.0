import { createMistral } from '@ai-sdk/mistral';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const mistralConfig: ProviderConfig = {
  id: 'mistral',
  name: 'Mistral',
  apiKeyEnvVar: 'MISTRAL_API_KEY',
  models: [
    {
      id: 'codestral-25.01',
      name: 'Codestral 25.01',
      description: '#1 on LMsys copilot arena. 256K context, 80+ languages, 2.5x faster than predecessors.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.28,
        output: 0.82,
      },
      isDefault: true,
    },
    {
      id: 'mistral-large-2',
      name: 'Mistral Large 2',
      description: 'Second-generation flagship optimized for multilingual engineering and reasoning.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 160000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 1.9,
        output: 5.4,
      },
    },
    {
      id: 'mistral-small-3',
      name: 'Mistral Small 3',
      description: 'Ultra-fast lightweight model for microservices, CLI agents, and high-volume tasks.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 48000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.18,
        output: 0.5,
      },
    },
  ],
};

export const mistralProvider: Provider = {
  config: mistralConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const mistral = createMistral({ apiKey });
    const selectedModel = modelId || getDefaultModel('mistral')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Mistral');
    }

    return mistral(selectedModel);
  },
};
