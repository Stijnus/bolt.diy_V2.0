import { SettingsSection } from '~/components/settings/SettingsSection';
import { UsageDashboard } from '~/components/settings/UsageDashboard';

export function UsageTab() {
  return (
    <SettingsSection title="Usage" description="View your token usage and estimated costs" status="implemented">
      <UsageDashboard />
    </SettingsSection>
  );
}
