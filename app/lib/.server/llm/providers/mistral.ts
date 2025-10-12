import { createMistral } from '@ai-sdk/mistral';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const mistralConfig: ProviderConfig = {
  id: 'mistral',
  name: 'Mistral',
  apiKeyEnvVar: 'MISTRAL_API_KEY',
  models: [
    {
      id: 'codestral-25.10',
      name: 'Codestral 25.10',
      description: 'Latest Codestral with 300K context and compiler-aware reasoning.',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 300000,
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
      description: 'Second-generation large model optimized for multilingual engineering.',
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
      description: 'Ultra-fast assistant built for microservices, CLI agents, and automation.',
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
