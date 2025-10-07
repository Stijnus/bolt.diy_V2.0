import { describe, it, expect } from 'vitest';
import { calculateCost } from './cost-calculator';
import type { ModelInfo } from './providers/types';

describe('calculateCost', () => {
  const mockModelWithPricing: ModelInfo = {
    id: 'test-model',
    name: 'Test Model',
    provider: 'test',
    pricing: {
      input: 1.0, // $1 per 1M input tokens
      output: 2.0, // $2 per 1M output tokens
    },
    contextWindow: 4096,
    maxTokens: 1024,
    capabilities: {
      coding: true,
    }
  };

  const mockModelWithoutPricing: ModelInfo = {
    id: 'free-model',
    name: 'Free Model',
    provider: 'test',
    contextWindow: 4096,
    maxTokens: 1024,
    capabilities: {
      coding: true,
    }
  };

  it('should calculate the cost correctly for a given number of input and output tokens', () => {
    const inputTokens = 500_000;
    const outputTokens = 250_000;
    const expectedCost = (500_000 / 1_000_000) * 1.0 + (250_000 / 1_000_000) * 2.0; // 0.5 * 1.0 + 0.25 * 2.0 = 0.5 + 0.5 = 1.0
    const cost = calculateCost(mockModelWithPricing, inputTokens, outputTokens);
    expect(cost).toBeCloseTo(1.0);
  });

  it('should return null if the model has no pricing information', () => {
    const cost = calculateCost(mockModelWithoutPricing, 1000, 500);
    expect(cost).toBeNull();
  });

  it('should handle zero tokens correctly', () => {
    const cost = calculateCost(mockModelWithPricing, 0, 0);
    expect(cost).toBe(0);
  });

  it('should calculate cost correctly with only input tokens', () => {
    const inputTokens = 1_000_000;
    const cost = calculateCost(mockModelWithPricing, inputTokens, 0);
    expect(cost).toBe(1.0);
  });

  it('should calculate cost correctly with only output tokens', () => {
    const outputTokens = 1_000_000;
    const cost = calculateCost(mockModelWithPricing, 0, outputTokens);
    expect(cost).toBe(2.0);
  });
});