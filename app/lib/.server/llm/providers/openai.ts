import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const openaiConfig: ProviderConfig = {
  id: 'openai',
  name: 'OpenAI',
  apiKeyEnvVar: 'OPENAI_API_KEY',
  models: [
    {
      id: 'gpt-5',
      name: 'GPT-5',
      description: 'Smartest model with built-in thinking. 74.9% on SWE-bench, strongest coding model.',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 5,
        output: 15,
      },
      isDefault: true,
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description: 'Specialized for coding tasks with precise instruction following and web development.',
      provider: 'openai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 3,
        output: 12,
      },
    },
    {
      id: 'o3',
      name: 'OpenAI o3',
      description: 'Advanced reasoning model with 20% fewer errors on difficult real-world tasks.',
      provider: 'openai',
      maxTokens: 100000,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 10,
        output: 40,
      },
      isReasoningModel: true,
    },
    {
      id: 'o4-mini',
      name: 'OpenAI o4-mini',
      description: 'Fast, cost-efficient reasoning model optimized for performance.',
      provider: 'openai',
      maxTokens: 65536,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 1.1,
        output: 4.4,
      },
      isReasoningModel: true,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Multimodal model with strong general capabilities.',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 2.5,
        output: 10,
      },
    },
  ],
};

export const openaiProvider: Provider = {
  config: openaiConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openai = createOpenAI({ apiKey });
    const selectedModel = modelId || getDefaultModel('openai')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for OpenAI');
    }

    return openai(selectedModel);
  },
};
