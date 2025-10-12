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
      description: 'Smartest model with built-in thinking. State-of-the-art on math, coding, and reasoning.',
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
        input: 1.25,
        output: 10,
      },
      isDefault: true,
    },
    {
      id: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      description: 'Fast and affordable GPT-5 tier optimized for high-volume tasks and agent loops.',
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
        input: 0.25,
        output: 2,
      },
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description: 'Creative and agentic model with 1M context and 32K output tokens. 26% cheaper than GPT-4o.',
      provider: 'openai',
      maxTokens: 32768,
      contextWindow: 1000000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 2.0,
        output: 8.0,
      },
    },
    {
      id: 'o3',
      name: 'OpenAI o3',
      description: 'Advanced reasoning model for complex problem-solving, proofs, and strategic planning.',
      provider: 'openai',
      maxTokens: 100000,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 3.0,
        output: 12,
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
