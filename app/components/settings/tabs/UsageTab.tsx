import { SettingsSection } from '~/components/settings/SettingsSection';
import { UsageDashboard } from '~/components/settings/UsageDashboard';
import { Label } from '~/components/ui/Label';
import { Switch } from '~/components/ui/Switch';
import type { UserPreferences } from '~/lib/stores/settings';

export function UsageTab({
  preferences,
  onPreferenceChange,
  isAuthenticated,
}: {
  preferences: UserPreferences;
  onPreferenceChange: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  isAuthenticated: boolean;
}) {
  return (
    <SettingsSection title="Usage" description="View your token usage and estimated costs" status="implemented">
      <div className="mb-6 space-y-4 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Reset usage when model changes</Label>
            <div className="text-xs text-bolt-elements-textSecondary">
              When enabled, the footer counters reset on model switch.
            </div>
          </div>
          <Switch
            checked={Boolean(preferences.resetUsageOnModelChange)}
            onChange={(v) => onPreferenceChange('resetUsageOnModelChange', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Sync usage to Supabase</Label>
            <div className="text-xs text-bolt-elements-textSecondary">
              Store usage records in your account for cloud history. {isAuthenticated ? '' : 'Sign in required.'}
            </div>
          </div>
          <Switch
            checked={Boolean(preferences.syncUsageToSupabase)}
            onChange={(v) => onPreferenceChange('syncUsageToSupabase', v)}
            disabled={!isAuthenticated}
          />
        </div>
      </div>
      <UsageDashboard />
    </SettingsSection>
  );
}
