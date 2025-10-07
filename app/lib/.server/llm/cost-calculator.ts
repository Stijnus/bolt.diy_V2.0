import type { ModelInfo } from './providers/types';

/**
 * Calculates the cost of an AI interaction.
 *
 * @param model - The model information, including pricing.
 * @param inputTokens - The number of input tokens used.
 * @param outputTokens - The number of output tokens used.
 * @returns The calculated cost in USD, or null if pricing is unavailable.
 */
export function calculateCost(
  model: ModelInfo,
  inputTokens: number,
  outputTokens: number,
): number | null {
  if (!model.pricing) {
    return null;
  }

  const { input, output } = model.pricing;

  // Prices are per 1 million tokens, so we divide by 1,000,000
  const inputCost = (inputTokens / 1_000_000) * input;
  const outputCost = (outputTokens / 1_000_000) * output;

  return inputCost + outputCost;
}