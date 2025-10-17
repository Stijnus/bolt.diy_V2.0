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
  defaultModel: string; // Default model for new chats
  planModel: string; // Preferred model for PLAN mode (fallbacks to current model if unset)
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
}

export interface ProjectModelDefaults {
  defaultModel?: string;
  planModel?: string;
}

export type ProjectDefaultsMap = Record<string, ProjectModelDefaults>;

export interface LocalSyncSettings {
  autoSync: boolean;
  excludes: string[];
  lastSyncedAt?: string;
}

export interface UserPreferences {
  language: string;
  notifications: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  chatMode?: 'normal' | 'plan' | 'discussion';
  localSync?: LocalSyncSettings;

  // Usage tracking preferences
  resetUsageOnModelChange?: boolean;
  syncUsageToSupabase?: boolean;
}

export interface Settings {
  shortcuts: Shortcuts;
  editor: EditorSettings;
  ai: AISettings;
  preferences: UserPreferences;
  projectDefaults: ProjectDefaultsMap;
}

export const shortcutsStore = map<Shortcuts>({
  toggleTerminal: {
    key: 'j',
    ctrlOrMetaKey: true,
    action: () => workbenchStore.toggleTerminal(),
  },
});

export const defaultEditorSettings: EditorSettings = {
  tabSize: 2,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineHeight: 1.5,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
};

export const defaultAISettings: AISettings = {
  model: 'deepseek:deepseek-chat',
  defaultModel: 'anthropic:claude-sonnet-4-5-20250929', // Default for new chats
  planModel: 'anthropic:claude-sonnet-4-5-20250929', // Use a strong planner by default
  temperature: 0.7,
  maxTokens: 8192,
  streamResponse: true,
};

export const defaultUserPreferences: UserPreferences = {
  language: 'en',
  notifications: true,
  autoSave: true,
  autoSaveDelay: 1000,
  chatMode: 'normal',
  localSync: {
    autoSync: false,
    excludes: ['node_modules', '.vite', '.remix', 'public/build', 'dist'],
  },
  resetUsageOnModelChange: false,
  syncUsageToSupabase: false,
};

export const settingsStore = map<Settings>({
  shortcuts: shortcutsStore.get(),
  editor: defaultEditorSettings,
  ai: defaultAISettings,
  preferences: defaultUserPreferences,
  projectDefaults: {},
});

// Load and persist settings for guests in IndexedDB
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { getDatabase, getAppSettings, setAppSettings } = await import('~/lib/persistence/db');
      const db = await getDatabase();

      if (db) {
        const stored = await getAppSettings(db);
        console.log('[Settings] Loaded from IndexedDB:', stored);

        if (stored?.settings) {
          const current = settingsStore.get();
          console.log('[Settings] Current store state:', current);
          console.log('[Settings] Merging with stored settings:', stored.settings);

          // Merge stored with defaults to prevent missing keys
          const merged = {
            ...current,
            ...stored.settings,
            editor: { ...current.editor, ...(stored.settings.editor || {}) },
            ai: { ...current.ai, ...(stored.settings.ai || {}) },
            preferences: { ...current.preferences, ...(stored.settings.preferences || {}) },
            projectDefaults: {
              ...current.projectDefaults,
              ...((stored.settings as Settings | undefined)?.projectDefaults || {}),
            },
          };

          console.log('[Settings] Final merged settings:', merged);
          settingsStore.set(merged);
        }

        // Persist on changes (debounced minimal)
        let timeout: number | undefined;
        let lastSavedSignature: string | undefined;
        let pendingSignature: string | undefined;

        const getPersistPayload = (settings: Settings) => ({
          editor: settings.editor,
          ai: settings.ai,
          preferences: settings.preferences,
          projectDefaults: settings.projectDefaults,
        });

        const serializePayload = (settings: Settings) => JSON.stringify(getPersistPayload(settings));

        settingsStore.subscribe((value) => {
          console.log('[Settings] Store changed, scheduling save:', value);

          const payload = getPersistPayload(value);
          const signature = JSON.stringify(payload);

          if (signature === lastSavedSignature || signature === pendingSignature) {
            return;
          }

          window.clearTimeout(timeout);
          timeout = window.setTimeout(async () => {
            try {
              const latestState = settingsStore.get();
              const latestSignature = serializePayload(latestState);

              if (latestSignature !== signature) {
                console.log('[Settings] Detected newer settings state, skipping stale save');
                return;
              }

              console.log('[Settings] Saving to IndexedDB:', payload);
              pendingSignature = signature;
              await setAppSettings(db, payload);
              lastSavedSignature = signature;
              pendingSignature = undefined;
              console.log('[Settings] Successfully saved to IndexedDB');

              const currentState = settingsStore.get();

              if (currentState === value) {
                // Clone sections so subscribers see a fresh reference that matches what we saved.
                settingsStore.set({
                  ...value,
                  editor: { ...value.editor },
                  ai: { ...value.ai },
                  preferences: { ...value.preferences },
                  projectDefaults: { ...value.projectDefaults },
                });
              }
            } catch (error) {
              console.error('[Settings] Failed to save to IndexedDB:', error);
              pendingSignature = undefined;
            }
          }, 300);
        });
      } else {
        console.warn('[Settings] IndexedDB not available');
      }
    } catch (error) {
      console.error('[Settings] Error initializing IndexedDB persistence:', error);

      // ignore persistence errors for SSR / no-IDB environments
    }
  })();
}

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

export function updateLocalSyncSettings(updates: Partial<LocalSyncSettings>) {
  const currentSettings = settingsStore.get();
  const currentLocal = currentSettings.preferences.localSync ?? defaultUserPreferences.localSync!;
  settingsStore.set({
    ...currentSettings,
    preferences: {
      ...currentSettings.preferences,
      localSync: { ...currentLocal, ...updates },
    },
  });
}

export function updateUserPreferences(updates: Partial<UserPreferences>) {
  const currentSettings = settingsStore.get();
  settingsStore.set({
    ...currentSettings,
    preferences: { ...currentSettings.preferences, ...updates },
  });
}

export function setSettingsSections(
  sections: Pick<Settings, 'editor' | 'ai' | 'preferences'> & { projectDefaults?: ProjectDefaultsMap },
) {
  const currentSettings = settingsStore.get();
  settingsStore.set({
    ...currentSettings,
    editor: { ...sections.editor },
    ai: { ...sections.ai },
    preferences: { ...sections.preferences },
    projectDefaults: { ...(sections.projectDefaults ?? currentSettings.projectDefaults) },
  });
}

export function setProjectDefaultsMap(map: ProjectDefaultsMap) {
  const state = settingsStore.get();
  settingsStore.set({
    ...state,
    projectDefaults: { ...map },
  });
}

export function getProjectModelDefaults(projectId: string): ProjectModelDefaults | undefined {
  if (!projectId) {
    return undefined;
  }

  return settingsStore.get().projectDefaults[projectId];
}

export function setProjectModelDefaults(projectId: string, defaults: ProjectModelDefaults) {
  if (!projectId) {
    return;
  }

  const state = settingsStore.get();
  settingsStore.set({
    ...state,
    projectDefaults: {
      ...state.projectDefaults,
      [projectId]: {
        ...state.projectDefaults[projectId],
        ...defaults,
      },
    },
  });
}

export function removeProjectModelDefaults(projectId: string) {
  if (!projectId) {
    return;
  }

  const state = settingsStore.get();

  if (!(projectId in state.projectDefaults)) {
    return;
  }

  const next = { ...state.projectDefaults };
  delete next[projectId];

  settingsStore.set({
    ...state,
    projectDefaults: next,
  });
}
