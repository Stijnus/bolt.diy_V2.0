import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const googleConfig: ProviderConfig = {
  id: 'google',
  name: 'Google',
  apiKeyEnvVar: 'GOOGLE_API_KEY',
  models: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Best price/performance with thinking. 1M context, excels at agentic tasks and coding.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.15,
        output: 0.6,
      },
      isDefault: true,
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'State-of-the-art on math and science. 1M context with adaptive thinking and reasoning.',
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
        input: 1.25,
        output: 5,
      },
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Fast multimodal model with 1M context, native tool use, and superior speed.',
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
        input: 0.095,
        output: 0.38,
      },
    },
    {
      id: 'gemma-3-27b-it',
      name: 'Gemma 3 27B',
      description: 'Latest open Gemma with advanced reasoning and coding. 128K context, locally runnable.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.95,
        output: 0.95,
      },
    },
    {
      id: 'gemma-3-7b-it',
      name: 'Gemma 3 7B',
      description: 'Efficient 7B model optimized for speed and cost. Fast response with solid coding ability.',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.28,
        output: 0.28,
      },
    },
    {
      id: 'gemini-1.5-pro-latest',
      name: 'Gemini 1.5 Pro (Legacy)',
      description: 'Previous generation with 2M context. Kept for backward compatibility.',
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
        input: 3.5,
        output: 10.5,
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
