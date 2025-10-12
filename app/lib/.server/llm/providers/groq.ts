import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const groqConfig: ProviderConfig = {
  id: 'groq',
  name: 'Groq',
  apiKeyEnvVar: 'GROQ_API_KEY',
  models: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      description: 'Most capable Llama model with fast inference',
      provider: 'groq',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.59, output: 0.79 },
      isDefault: true,
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      description: 'Blazing fast 8B model for quick responses',
      provider: 'groq',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.05, output: 0.08 },
    },
    {
      id: 'mixtral-8x22b',
      name: 'Mixtral 8x22B',
      description: 'Newest Groq deployment of Mixtral with larger experts for structured reasoning.',
      provider: 'groq',
      maxTokens: 8192,
      contextWindow: 32768,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 0.33, output: 0.33 },
    },
    {
      id: 'google/gemma-3-12b',
      name: 'Gemma 3 12B',
      description: 'Gemma 3 upgrade optimized for instructions, spreadsheets, and IAM policies.',
      provider: 'groq',
      maxTokens: 8192,
      contextWindow: 8192,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.18, output: 0.18 },
    },
  ],
};

export const groqProvider: Provider = {
  config: groqConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    const selectedModel = modelId || getDefaultModel('groq')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Groq');
    }

    return openaiCompat(selectedModel);
  },
};
