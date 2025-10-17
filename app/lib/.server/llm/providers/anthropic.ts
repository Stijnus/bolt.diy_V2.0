import { createAnthropic } from '@ai-sdk/anthropic';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const anthropicConfig: ProviderConfig = {
  id: 'anthropic',
  name: 'Anthropic',
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  models: [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Best overall coding model with 30+ hour autonomy. State-of-the-art on SWE-bench.',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 3,
        output: 15,
      },
      isDefault: true,
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      description: 'Fastest model with near-frontier intelligence, ideal for quick tasks.',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 1,
        output: 5,
      },
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      description: 'Previous generation model, still highly capable for coding tasks.',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 3,
        output: 15,
      },
    },
    {
      id: 'claude-opus-4-1-20250805',
      name: 'Claude Opus 4.1',
      description: 'Exceptional model for specialized reasoning tasks.',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        vision: true,
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 15,
        output: 75,
      },
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Legacy)',
      description: 'Legacy model for backward compatibility.',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: {
        vision: true,
        tools: true,
        coding: true,
      },
      pricing: {
        input: 3,
        output: 15,
      },
    },
  ],
};

export const anthropicProvider: Provider = {
  config: anthropicConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const anthropic = createAnthropic({ apiKey });
    const selectedModel = modelId || getDefaultModel('anthropic')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for Anthropic');
    }

    return anthropic(selectedModel);
  },
};
