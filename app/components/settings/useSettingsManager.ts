import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  settingsStore,
  defaultEditorSettings,
  defaultAISettings,
  defaultUserPreferences,
  setSettingsSections,
  type Settings,
} from '~/lib/stores/settings';

const editorSchema = z.object({
  tabSize: z.number().int().min(1).max(8),
  fontSize: z.number().int().min(10).max(32),
  fontFamily: z.string().min(1),
  lineHeight: z.number().min(1).max(2),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  lineNumbers: z.boolean(),
});

const aiSchema = z.object({
  model: z.string().min(1),
  defaultModel: z.string().min(1),
  planModel: z.string().min(1),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().min(256).max(32768),
  streamResponse: z.boolean(),
});

const preferencesSchema = z.object({
  language: z.string().min(2),
  notifications: z.boolean(),
  autoSave: z.boolean(),
  autoSaveDelay: z.number().int().min(200).max(10000),
  chatMode: z.enum(['normal', 'plan', 'discussion']).optional(),

  // Usage tracking preferences
  resetUsageOnModelChange: z.boolean().optional(),
  syncUsageToSupabase: z.boolean().optional(),
});

const projectDefaultsSchema = z.record(
  z.string(),
  z.object({
    defaultModel: z.string().optional(),
    planModel: z.string().optional(),
  }),
);

const settingsSchema = z.object({
  editor: editorSchema,
  ai: aiSchema,
  preferences: preferencesSchema,
  projectDefaults: projectDefaultsSchema.optional().default({}),
});

export type SettingsDraft = z.infer<typeof settingsSchema>;
type FieldErrors = Record<string, string>;

export type SectionKey = keyof SettingsDraft;

export type SectionErrors = Record<SectionKey, Record<string, string>>;

export type SectionDirtyState = Record<SectionKey, boolean>;

type ImportPayload = {
  version: string;
  exportedAt?: string;
  settings: SettingsDraft;
};

function getDefaultDraft(): SettingsDraft {
  return {
    editor: clone(defaultEditorSettings),
    ai: clone(defaultAISettings),
    preferences: clone(defaultUserPreferences),
    projectDefaults: {},
  };
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i += 1) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }

      return true;
    }

    if (!Array.isArray(a) && !Array.isArray(b)) {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  return false;
}

function buildErrorMap(issues: Array<{ path: ReadonlyArray<PropertyKey>; message: string }>): FieldErrors {
  const result: FieldErrors = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join('.');

    if (path && !result[path]) {
      result[path] = issue.message;
    }
  }

  return result;
}

function groupErrors(errors: FieldErrors): SectionErrors {
  const grouped: SectionErrors = {
    editor: {},
    ai: {},
    preferences: {},
    projectDefaults: {},
  };

  for (const [path, message] of Object.entries(errors)) {
    const [section, ...rest] = path.split('.');

    if (section && section in grouped) {
      const key = rest.join('.') || section;
      grouped[section as SectionKey][key] = message;
    }
  }

  return grouped;
}

function sanitizeStore(settings: Settings): SettingsDraft {
  const parsed = settingsSchema.safeParse({
    editor: settings.editor,
    ai: settings.ai,
    preferences: settings.preferences,
    projectDefaults: settings.projectDefaults,
  });

  if (parsed.success) {
    return parsed.data;
  }

  return getDefaultDraft();
}

export function useSettingsManager() {
  const storeSettings = useStore(settingsStore);
  const sanitizedStore = useMemo(() => sanitizeStore(storeSettings), [storeSettings]);
  const [initial, setInitial] = useState<SettingsDraft>(clone(sanitizedStore));
  const [draft, setDraft] = useState<SettingsDraft>(clone(sanitizedStore));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [persistenceUnavailable, setPersistenceUnavailable] = useState(false);

  const groupedErrors = useMemo(() => groupErrors(errors), [errors]);
  const hasUnsavedChanges = useMemo(() => !deepEqual(draft, initial), [draft, initial]);

  const sectionDirtyState = useMemo(
    () => ({
      editor: !deepEqual(draft.editor, initial.editor),
      ai: !deepEqual(draft.ai, initial.ai),
      preferences: !deepEqual(draft.preferences, initial.preferences),
      projectDefaults: !deepEqual(draft.projectDefaults, initial.projectDefaults),
    }),
    [draft, initial],
  );

  useEffect(() => {
    setInitial(clone(sanitizedStore));

    if (!hasUnsavedChanges) {
      setDraft(clone(sanitizedStore));
      setErrors({});
    }
  }, [sanitizedStore, hasUnsavedChanges]);

  const validateDraft = useCallback((next: SettingsDraft) => {
    const validation = settingsSchema.safeParse(next);

    if (validation.success) {
      return { success: true as const, data: validation.data, errorMap: {} as FieldErrors };
    }

    return { success: false as const, errorMap: buildErrorMap(validation.error.issues) };
  }, []);

  const applyDraft = useCallback(
    (updater: (prev: SettingsDraft) => SettingsDraft) => {
      setDraft((prev) => {
        const next = updater(prev);
        const validation = validateDraft(next);
        setErrors(validation.errorMap);

        return next;
      });
    },
    [validateDraft],
  );

  const updateSection = useCallback(
    <K extends SectionKey>(section: K, updates: Partial<SettingsDraft[K]>) => {
      applyDraft((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          ...updates,
        },
      }));
    },
    [applyDraft],
  );

  const replaceSection = useCallback(
    <K extends SectionKey>(section: K, value: SettingsDraft[K]) => {
      applyDraft((prev) => ({
        ...prev,
        [section]: value,
      }));
    },
    [applyDraft],
  );

  const resetSection = useCallback(
    (section: SectionKey) => {
      const defaults = getDefaultDraft();
      replaceSection(section, defaults[section]);
    },
    [replaceSection],
  );

  const revertSection = useCallback(
    (section: SectionKey) => {
      replaceSection(section, initial[section]);
    },
    [initial, replaceSection],
  );

  const revertAll = useCallback(() => {
    setDraft(initial);
    setErrors({});
  }, [initial]);

  const getValidatedDraft = useCallback(() => {
    const validation = validateDraft(draft);

    if (!validation.success) {
      setErrors(validation.errorMap);
      throw new Error('Validation failed');
    }

    setErrors({});

    return validation.data;
  }, [draft, validateDraft]);

  const markSaved = useCallback(
    (saved: SettingsDraft) => {
      const validation = validateDraft(saved);

      if (!validation.success) {
        setErrors(validation.errorMap);
        return;
      }

      console.log('[SettingsManager] Marking as saved:', validation.data);
      setInitial(validation.data);
      setDraft(validation.data);
      setErrors({});
      setSettingsSections(validation.data);
    },
    [validateDraft],
  );

  const importSettings = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid settings payload');
    }

    const maybe = payload as Partial<ImportPayload>;
    const source = maybe.settings ?? maybe;
    const validation = settingsSchema.safeParse(source);

    if (!validation.success) {
      throw new Error('Settings file is not valid');
    }

    setDraft(validation.data);
    setErrors({});
  }, []);

  const getExportPayload = useCallback(() => {
    const validation = validateDraft(draft);

    if (!validation.success) {
      setErrors(validation.errorMap);
      throw new Error('Fix validation errors before exporting');
    }

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings: validation.data,
    } satisfies ImportPayload;
  }, [draft, validateDraft]);

  return {
    draft,
    initial,
    errors,
    groupedErrors,
    hasUnsavedChanges,
    sectionDirtyState,
    updateSection,
    replaceSection,
    resetSection,
    revertSection,
    revertAll,
    getValidatedDraft,
    markSaved,
    importSettings,
    getExportPayload,
    persistenceUnavailable,
    setPersistenceUnavailable,
  };
}
