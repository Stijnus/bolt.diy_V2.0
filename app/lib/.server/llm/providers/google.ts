import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getDefaultModel } from '../model-config';
import type { Provider, ProviderConfig } from './types';

export const googleConfig: ProviderConfig = {
  id: 'google',
  name: 'Google',
  apiKeyEnvVar: 'GOOGLE_API_KEY',
  models: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: '#1 on WebDev Arena. Excellent for building interactive web apps with 1M token context.',
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
        input: 2.5,
        output: 10,
      },
      isDefault: true,
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Fast and cost-effective model for quick coding tasks.',
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
        input: 0.15,
        output: 0.6,
      },
    },
    {
      id: 'gemini-exp-1206',
      name: 'Gemini Experimental',
      description: 'Latest experimental model with cutting-edge capabilities.',
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
        input: 2.5,
        output: 10,
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
