import { setCurrentModel } from '~/lib/stores/model';
import {
  updateEditorSettings,
  updateAISettings,
  updateUserPreferences,
  setProjectDefaultsMap,
} from '~/lib/stores/settings';

/**
 * Load user settings from database and apply them to the stores
 */
export async function loadUserSettings() {
  try {
    const response = await fetch('/api/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to load user settings:', response.statusText);
      return;
    }

    const data = await response.json();
    const { settings } = data as { settings: any };

    if (!settings || typeof settings !== 'object') {
      console.log('No settings found for user, using defaults');
      return;
    }

    console.log('Loading user settings from database:', settings);

    // Apply loaded settings to stores
    if (settings.editor) {
      updateEditorSettings(settings.editor);
    }

    if (settings.ai) {
      updateAISettings(settings.ai);

      // Update model selection if specified
      if (settings.ai.model) {
        try {
          const [provider, modelId] = settings.ai.model.split(':');

          if (provider && modelId) {
            setCurrentModel(provider as any, modelId);
          }
        } catch {
          console.warn('Invalid model format in settings:', settings.ai.model);
        }
      }
    }

    if (settings.preferences) {
      updateUserPreferences(settings.preferences);
    }

    if (settings.projectDefaults) {
      setProjectDefaultsMap(settings.projectDefaults);
    }

    console.log('Successfully applied user settings from database');
  } catch (error) {
    console.error('Error loading user settings:', error);
  }
}
