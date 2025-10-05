import { createDeepSeek } from '@ai-sdk/deepseek';
import type { Provider, ProviderConfig } from './types';

export const deepseekConfig: ProviderConfig = {
  id: 'deepseek',
  name: 'DeepSeek',
  apiKeyEnvVar: 'DEEPSEEK_API_KEY',
  models: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek V3.2',
      description: 'Cost-effective model with excellence in math and code. 671B parameters with MoE architecture.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
        fast: true,
      },
      pricing: {
        input: 0.28,
        output: 0.42,
        cachedInput: 0.028,
      },
      isDefault: true,
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      description: 'Advanced reasoning model for complex problem-solving.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.55,
        output: 2.19,
        cachedInput: 0.14,
      },
    },
  ],
};

export const deepseekProvider: Provider = {
  config: deepseekConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const deepseek = createDeepSeek({ apiKey });
    const selectedModel = modelId || 'deepseek-chat';

    return deepseek(selectedModel);
  },
};
