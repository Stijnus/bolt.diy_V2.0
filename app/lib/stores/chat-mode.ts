import { map } from 'nanostores';
import { settingsStore } from '~/lib/stores/settings';

export type ChatMode = 'normal' | 'plan' | 'discussion';

export interface PendingPlan {
  messageId: string;
  content: string;
}

export interface ChatModeState {
  mode: ChatMode;
  pendingPlan: PendingPlan | null;
}

export const chatModeStore = map<ChatModeState>({
  mode: settingsStore.get().preferences.chatMode ?? 'normal',
  pendingPlan: null,
});

/**
 * Set the current chat mode
 */
export function setMode(mode: ChatMode) {
  chatModeStore.setKey('mode', mode);

  // Persist to settings
  const current = settingsStore.get();
  settingsStore.set({
    ...current,
    preferences: { ...current.preferences, chatMode: mode },
  });

  // Clear pending plan when switching modes
  if (mode !== 'plan') {
    chatModeStore.setKey('pendingPlan', null);
  }
}

/**
 * Set a pending plan for approval
 */
export function setPendingPlan(messageId: string, content: string) {
  chatModeStore.setKey('pendingPlan', { messageId, content });
}

/**
 * Clear the pending plan
 */
export function clearPendingPlan() {
  chatModeStore.setKey('pendingPlan', null);
}

/**
 * Approve the current plan
 * Returns the plan content for execution
 */
export function approvePlan(): string | null {
  const { pendingPlan } = chatModeStore.get();

  if (!pendingPlan) {
    return null;
  }

  const planContent = pendingPlan.content;

  // Switch to normal mode for execution
  setMode('normal');
  clearPendingPlan();

  return planContent;
}

/**
 * Reject the current plan
 */
export function rejectPlan() {
  clearPendingPlan();

  // Stay in plan mode for revision
}

/**
 * Check if actions should be executed based on current mode
 */
export function shouldExecuteActions(): boolean {
  const { mode } = chatModeStore.get();
  return mode === 'normal';
}

/**
 * Check if artifacts should be parsed based on current mode
 */
export function shouldParseArtifacts(): boolean {
  const { mode } = chatModeStore.get();
  return mode === 'normal';
}
