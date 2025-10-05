import { createAnthropic } from '@ai-sdk/anthropic';
import type { Provider, ProviderConfig } from './types';

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
    const selectedModel = modelId || 'claude-sonnet-4-5-20250929';

    return anthropic(selectedModel);
  },
};
