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
      description:
        'Flagship general-intelligence model with persistent chain-of-thought and world-class coding skills.',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 256000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 4.8,
        output: 14.5,
      },
      isDefault: true,
    },
    {
      id: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      description: 'High-accuracy GPT-5 tier tuned for fast iteration and agent loops.',
      provider: 'openai',
      maxTokens: 12288,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 2.2,
        output: 6.6,
      },
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description: '2025 refresh optimized for software engineering and compliance workloads.',
      provider: 'openai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 2.6,
        output: 9.5,
      },
    },
    {
      id: 'o3',
      name: 'OpenAI o3',
      description: 'Reasoning-first model excelling at proofs, strategy, and complex debugging.',
      provider: 'openai',
      maxTokens: 100000,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 9.5,
        output: 36,
      },
      isReasoningModel: true,
    },
    {
      id: 'o4-mini',
      name: 'OpenAI o4-mini',
      description: 'Lightweight reasoning model for orchestrating multi-agent systems at low cost.',
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
        input: 1,
        output: 4,
      },
      isReasoningModel: true,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Multimodal GPT-4o (Nov 2025) with state-of-the-art audio and vision grounding.',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 2.3,
        output: 9.2,
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
