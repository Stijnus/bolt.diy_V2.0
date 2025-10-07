import { describe, it, expect, vi } from 'vitest';
import { createModel, createModelFromFullId, getProviderApiKey } from './provider-factory';
import { DEFAULT_PROVIDER, DEFAULT_MODEL_ID } from './model-config';
import type { AIProvider } from './providers/types';

// Mock the provider modules
vi.mock('./providers', () => ({
  anthropicProvider: {
    config: { apiKeyEnvVar: 'ANTHROPIC_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'anthropic', apiKey, modelId })),
  },
  deepseekProvider: {
    config: { apiKeyEnvVar: 'DEEPSEEK_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'deepseek', apiKey, modelId })),
  },
  googleProvider: {
    config: { apiKeyEnvVar: 'GOOGLE_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'google', apiKey, modelId })),
  },
  openaiProvider: {
    config: { apiKeyEnvVar: 'OPENAI_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'openai', apiKey, modelId })),
  },
  xaiProvider: {
    config: { apiKeyEnvVar: 'XAI_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'xai', apiKey, modelId })),
  },
  mistralProvider: {
    config: { apiKeyEnvVar: 'MISTRAL_API_KEY' },
    createModel: vi.fn((apiKey, modelId) => ({ provider: 'mistral', apiKey, modelId })),
  },
}));

// Mock the model-config module
vi.mock('./model-config', () => ({
  DEFAULT_PROVIDER: 'anthropic',
  DEFAULT_MODEL_ID: 'claude-sonnet-4-5-20250929',
  getModel: vi.fn((provider, modelId) => {
    if (provider === 'anthropic' && modelId === 'claude-sonnet-4-5-20250929') {
      return { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' };
    }
    if (provider === 'openai' && modelId === 'gpt-5') {
        return { id: 'gpt-5', name: 'GPT-5' };
    }
    return null;
  }),
}));

const mockEnv = {
  ANTHROPIC_API_KEY: 'anthropic-key',
  OPENAI_API_KEY: 'openai-key',
  // Missing other keys to test fallback and error handling
} as any;

describe('Provider Factory', () => {
  describe('getProviderApiKey', () => {
    it('should return the API key for a given provider', () => {
      const key = getProviderApiKey('openai', mockEnv);
      expect(key).toBe('openai-key');
    });

    it('should return undefined if the API key is not set', () => {
      const key = getProviderApiKey('google', mockEnv);
      expect(key).toBeUndefined();
    });
  });

  describe('createModel', () => {
    it('should create a default model instance when no provider is specified', () => {
      const model = createModel(undefined, undefined, mockEnv);
      expect(model).toEqual({
        provider: DEFAULT_PROVIDER,
        apiKey: 'anthropic-key',
        modelId: undefined,
      });
    });

    it('should create a model for a specified provider', () => {
      const model = createModel('openai', 'gpt-5', mockEnv);
      expect(model).toEqual({
        provider: 'openai',
        apiKey: 'openai-key',
        modelId: 'gpt-5',
      });
    });

    it('should throw an error if the API key for the specified provider is missing', () => {
      expect(() => createModel('google', 'gemini-2.5-pro', mockEnv)).toThrow(
        'Missing API key for provider google. Please set GOOGLE_API_KEY in your environment.',
      );
    });

    it('should use the default model for a provider if the specified modelId is invalid', () => {
        const model = createModel('openai', 'invalid-model', mockEnv);
        expect(model).toEqual({
          provider: 'openai',
          apiKey: 'openai-key',
          modelId: undefined, // Falls back to default
        });
      });
  });

  describe('createModelFromFullId', () => {
    it('should create a model from a "provider:modelId" string', () => {
      const model = createModelFromFullId('openai:gpt-5', mockEnv);
      expect(model).toEqual({
        provider: 'openai',
        apiKey: 'openai-key',
        modelId: 'gpt-5',
      });
    });

    it('should create a default model instance if the fullId is invalid', () => {
      // It should fall back to the default model if the provider part of the ID is not supported
      const model = createModelFromFullId('invalid-provider:some-model', mockEnv);
      expect(model).toEqual({
        provider: DEFAULT_PROVIDER,
        apiKey: 'anthropic-key',
        modelId: DEFAULT_MODEL_ID,
      });
    });

    it('should create a default model if the fullId is just a provider', () => {
        const model = createModelFromFullId('openai:', mockEnv);
        expect(model).toEqual({
          provider: 'openai',
          apiKey: 'openai-key',
          modelId: '',
        });
      });
  });
});