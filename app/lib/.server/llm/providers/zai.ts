import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const zaiConfig: ProviderConfig = {
  id: 'zai',
  name: 'ZAI (GLM)',
  apiKeyEnvVar: 'ZAI_API_KEY',
  models: [
    {
      id: 'glm-4.6',
      name: 'GLM-4.6',
      description: 'Latest flagship GLM model with state-of-the-art coding and reasoning capabilities.',
      provider: 'zai',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 1.0,
        output: 2.0,
      },
      isDefault: true,
    },
    {
      id: 'glm-4.5',
      name: 'GLM-4.5',
      description: 'Previous flagship GLM model with excellent coding and reasoning performance.',
      provider: 'zai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.75,
        output: 1.5,
      },
    },
    {
      id: 'glm-4-flash',
      name: 'GLM-4-Flash',
      description: 'Fast and efficient GLM model optimized for coding tasks.',
      provider: 'zai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.3,
        output: 0.6,
      },
    },
    {
      id: 'glm-4-plus',
      name: 'GLM-4-Plus',
      description: 'Enhanced GLM model with superior coding and reasoning capabilities.',
      provider: 'zai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.5,
        output: 1.0,
      },
    },
    {
      id: 'glm-4-air',
      name: 'GLM-4-Air',
      description: 'Lightweight GLM model for efficient coding assistance.',
      provider: 'zai',
      maxTokens: 4096,
      contextWindow: 32000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.2,
        output: 0.4,
      },
    },
  ],
};

export const zaiProvider: Provider = {
  config: zaiConfig,
  createModel: (apiKey: string, modelId?: string) => {
    // Create ZAI client using OpenAI SDK (assuming OpenAI-compatible API)
    const zai = createOpenAI({
      apiKey,
      baseURL: 'https://api.zai.com/v1', // Replace with actual ZAI API endpoint
    });

    const selectedModel = modelId || getDefaultModel('zai')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for ZAI');
    }

    return zai(selectedModel);
  },
};
