import { createOpenAI } from '@ai-sdk/openai';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const perplexityConfig: ProviderConfig = {
  id: 'perplexity',
  name: 'Perplexity AI',
  apiKeyEnvVar: 'PERPLEXITY_API_KEY',
  models: [
    {
      id: 'sonar-pro-2-online',
      name: 'Sonar Pro 2 (Online)',
      description: 'Latest Sonar with live web search, citations, and improved RAG speed.',
      provider: 'perplexity',
      maxTokens: 8192,
      contextWindow: 160000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 1.1, output: 1.1 },
      isDefault: true,
    },
    {
      id: 'sonar-lite-2-online',
      name: 'Sonar Lite 2 (Online)',
      description: 'Lightweight web-enabled assistant ideal for quick fact checks and scaffolding.',
      provider: 'perplexity',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.22, output: 0.22 },
    },
    {
      id: 'llama-3.1-405b-offline',
      name: 'Llama 3.1 405B (Offline)',
      description: 'Largest offline option for high-accuracy reasoning without external calls.',
      provider: 'perplexity',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, coding: true, reasoning: true },
      pricing: { input: 1.6, output: 1.6 },
    },
  ],
};

export const perplexityProvider: Provider = {
  config: perplexityConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const openaiCompat = createOpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const selectedModel = modelId || getDefaultModel('perplexity')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Perplexity AI');
    }

    return openaiCompat(selectedModel);
  },
};
