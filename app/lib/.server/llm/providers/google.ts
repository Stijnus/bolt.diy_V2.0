import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const googleConfig: ProviderConfig = {
  id: 'google',
  name: 'Google',
  apiKeyEnvVar: 'GOOGLE_API_KEY',
  models: [
    {
      id: 'gemini-2.5-ultra',
      name: 'Gemini 2.5 Ultra',
      description: 'Enterprise flagship with 2M context, best-in-class web and Android knowledge.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 2000000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 3,
        output: 12,
      },
      isDefault: true,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Balanced model for production-grade coding and architectural planning.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 2.2,
        output: 8.8,
      },
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Latency-optimized tier with full multimodal support and cached contexts.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.12,
        output: 0.45,
      },
    },
    {
      id: 'gemma-3-27b',
      name: 'Gemma 3 27B',
      description: 'High-performance Gemma 3 model with advanced reasoning and coding capabilities',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 8000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.8,
        output: 0.8,
      },
    },
    {
      id: 'gemma-3-12b',
      name: 'Gemma 3 12B',
      description: 'Efficient Gemma 3 model optimized for fast response and cost-effectiveness',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 8000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.25,
        output: 0.25,
      },
    },
    {
      id: 'gemma-3-4b',
      name: 'Gemma 3 4B',
      description: 'Lightweight Gemma 3 model ideal for simple tasks and high-throughput scenarios',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 8000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.08,
        output: 0.08,
      },
    },
  ],
};

export const googleProvider: Provider = {
  config: googleConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const google = createGoogleGenerativeAI({ apiKey });
    const selectedModel = modelId || getDefaultModel('google')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Google');
    }

    return google(selectedModel);
  },
};
