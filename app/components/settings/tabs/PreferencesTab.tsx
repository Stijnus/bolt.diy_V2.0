import { SettingItem } from '~/components/settings/SettingItem';
import { SettingsSection } from '~/components/settings/SettingsSection';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
import type { UserPreferences } from '~/lib/stores/settings';

interface PreferencesTabProps {
  preferences: UserPreferences;
  onPreferenceChange: (key: keyof UserPreferences, value: any) => void;
  onReset: () => void;
}

export function PreferencesTab({ preferences, onPreferenceChange, onReset }: PreferencesTabProps) {
  return (
    <SettingsSection
      title="Preferences"
      description="General application settings"
      status="coming-soon"
      onReset={onReset}
    >
      <SettingItem
        label="Notifications"
        description="Enable browser notifications"
        tooltip="Receive desktop notifications for important events and updates. Your browser may ask for permission."
      >
        <Switch
          checked={preferences.notifications}
          onChange={(checked) => onPreferenceChange('notifications', checked)}
        />
      </SettingItem>
      <SettingItem
        label="Auto Save"
        description="Automatically save changes"
        tooltip="Automatically saves your work as you type. Prevents data loss from browser crashes or accidental closures."
      >
        <Switch checked={preferences.autoSave} onChange={(checked) => onPreferenceChange('autoSave', checked)} />
      </SettingItem>
      <SettingItem
        label="Auto Save Delay"
        description="Delay before auto-saving (ms)"
        tooltip="Time to wait after you stop typing before auto-save triggers. Lower values save more frequently but may impact performance."
      >
        <Input
          type="number"
          min={500}
          max={5000}
          step={500}
          value={preferences.autoSaveDelay}
          onChange={(e) => onPreferenceChange('autoSaveDelay', parseInt(e.target.value, 10))}
          className="w-24"
          disabled={!preferences.autoSave}
        />
      </SettingItem>
    </SettingsSection>
  );
}
