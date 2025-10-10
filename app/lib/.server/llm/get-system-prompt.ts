import { getModelByFullId } from './model-config';
import { getSystemPrompt } from './prompts';
import { getReasoningSystemPrompt } from './prompts-reasoning';
import { WORK_DIR } from '~/utils/constants';

/**
 * Gets the appropriate system prompt based on the model type.
 *
 * Reasoning models (o1, o3, DeepSeek R1) require different prompting:
 * - Minimal, concise instructions
 * - No explicit chain-of-thought directives
 * - Fewer examples
 * - Direct task description
 *
 * Standard models (Claude, GPT-4o, Gemini) work better with:
 * - Comprehensive instructions
 * - Code quality standards
 * - Multiple examples
 * - Detailed guidelines
 *
 * @param modelFullId - Full model ID in format "provider:modelId" (e.g., "openai:o3")
 * @param cwd - Current working directory (defaults to WORK_DIR)
 * @returns Optimized system prompt for the model type
 */
export function getBoltSystemPrompt(modelFullId: string, cwd: string = WORK_DIR): string {
  // Get model info to check if it's a reasoning model
  const modelInfo = getModelByFullId(modelFullId);

  // Use reasoning-optimized prompt for reasoning models
  if (modelInfo?.isReasoningModel) {
    return getReasoningSystemPrompt(cwd);
  }

  // Use standard comprehensive prompt for all other models
  return getSystemPrompt(cwd);
}

/**
 * Check if a model is a reasoning model.
 * Useful for additional optimizations beyond prompt selection.
 */
export function isReasoningModel(modelFullId: string): boolean {
  const modelInfo = getModelByFullId(modelFullId);
  return modelInfo?.isReasoningModel ?? false;
}
