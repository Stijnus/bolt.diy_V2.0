import { createDeepSeek } from '@ai-sdk/deepseek';
import type { Provider, ProviderConfig } from './types';
import { getDefaultModel } from '~/lib/.server/llm/model-config';

export const deepseekConfig: ProviderConfig = {
  id: 'deepseek',
  name: 'DeepSeek',
  apiKeyEnvVar: 'DEEPSEEK_API_KEY',
  models: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat V3.2-Exp',
      description: 'Latest DeepSeek-V3.2-Exp model with 128K context and enhanced reasoning.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.028,
        output: 0.042,
        cachedInput: 0.014,
      },
      isDefault: true,
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner V3.2-Exp',
      description: 'Latest DeepSeek-V3.2-Exp reasoning model with transparent chain-of-thought and 64K output.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.028,
        output: 0.042,
        cachedInput: 0.014,
      },
      isReasoningModel: true,
    },
  ],
};

export const deepseekProvider: Provider = {
  config: deepseekConfig,
  createModel: (apiKey: string, modelId?: string) => {
    const deepseek = createDeepSeek({ apiKey });
    const selectedModel = modelId || getDefaultModel('deepseek')?.id;

    if (!selectedModel) {
      throw new Error('No default model found for DeepSeek');
    }

    return deepseek(selectedModel);
  },
};
