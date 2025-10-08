import { map } from 'nanostores';
import { workbenchStore } from './workbench';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlOrMetaKey?: boolean;
  action: () => void;
}

export interface Shortcuts {
  toggleTerminal: Shortcut;
}

export interface EditorSettings {
  tabSize: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
}

export interface UserPreferences {
  language: string;
  notifications: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface Settings {
  shortcuts: Shortcuts;
  editor: EditorSettings;
  ai: AISettings;
  preferences: UserPreferences;
}

export const shortcutsStore = map<Shortcuts>({
  toggleTerminal: {
    key: 'j',
    ctrlOrMetaKey: true,
    action: () => workbenchStore.toggleTerminal(),
  },
});

const defaultEditorSettings: EditorSettings = {
  tabSize: 2,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineHeight: 1.5,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
};

const defaultAISettings: AISettings = {
  model: 'deepseek:deepseek-chat',
  temperature: 0.7,
  maxTokens: 8192,
  streamResponse: true,
};

const defaultUserPreferences: UserPreferences = {
  language: 'en',
  notifications: true,
  autoSave: true,
  autoSaveDelay: 1000,
};

export const settingsStore = map<Settings>({
  shortcuts: shortcutsStore.get(),
  editor: defaultEditorSettings,
  ai: defaultAISettings,
  preferences: defaultUserPreferences,
});

shortcutsStore.subscribe((shortcuts) => {
  settingsStore.set({
    ...settingsStore.get(),
    shortcuts,
  });
});

// helper functions to update specific settings
export function updateEditorSettings(updates: Partial<EditorSettings>) {
  const currentSettings = settingsStore.get();
  settingsStore.set({
    ...currentSettings,
    editor: { ...currentSettings.editor, ...updates },
  });
}

export function updateAISettings(updates: Partial<AISettings>) {
  const currentSettings = settingsStore.get();
  settingsStore.set({
    ...currentSettings,
    ai: { ...currentSettings.ai, ...updates },
  });
}

export function updateUserPreferences(updates: Partial<UserPreferences>) {
  const currentSettings = settingsStore.get();
  settingsStore.set({
    ...currentSettings,
    preferences: { ...currentSettings.preferences, ...updates },
  });
}
