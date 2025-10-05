import { atom, map } from 'nanostores';
import type { AIProvider, FullModelId, ModelSelection } from '~/types/model';

/**
 * Currently selected model.
 */
export const currentModel = atom<ModelSelection>({
  provider: 'anthropic',
  modelId: 'claude-sonnet-4-5-20250929',
  fullId: 'anthropic:claude-sonnet-4-5-20250929',
});

/**
 * Model selection per chat session.
 */
export const chatModels = map<Record<string, ModelSelection>>({});

/**
 * Set the current model.
 */
export function setCurrentModel(provider: AIProvider, modelId: string) {
  const fullId: FullModelId = `${provider}:${modelId}`;
  currentModel.set({
    provider,
    modelId,
    fullId,
  });
}

/**
 * Set model for a specific chat.
 */
export function setChatModel(chatId: string, provider: AIProvider, modelId: string) {
  const fullId: FullModelId = `${provider}:${modelId}`;
  chatModels.setKey(chatId, {
    provider,
    modelId,
    fullId,
  });
}

/**
 * Get model for a specific chat, or fall back to current model.
 */
export function getChatModel(chatId: string): ModelSelection {
  return chatModels.get()[chatId] || currentModel.get();
}

/**
 * Parse full model ID.
 */
export function parseFullModelId(fullId: FullModelId): { provider: AIProvider; modelId: string } {
  const [provider, modelId] = fullId.split(':') as [AIProvider, string];
  return { provider, modelId };
}
