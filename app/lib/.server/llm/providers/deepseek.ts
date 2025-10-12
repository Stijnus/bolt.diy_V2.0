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
      description: '671B model (37B activated) with 128K context. Sparse attention for efficient inference.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.27,
        output: 1.1,
        cachedInput: 0.07,
      },
      isDefault: true,
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner V3.2-Exp',
      description: 'Advanced reasoning with transparent chain-of-thought. Excels at math, logic, and debugging.',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: {
        tools: true,
        reasoning: true,
        coding: true,
      },
      pricing: {
        input: 0.27,
        output: 1.1,
        cachedInput: 0.07,
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
