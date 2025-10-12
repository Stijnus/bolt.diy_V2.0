import { Loader2 } from 'lucide-react';
import { ClientOnly } from 'remix-utils/client-only';

import { SettingsPage } from '~/components/settings/SettingsPage';

export default function SettingsRoute() {
  return (
    <ClientOnly
      fallback={
        <div className="flex h-screen items-center justify-center bg-bolt-elements-background-depth-1">
          <div className="flex items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-6 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-textSecondary" />
            <span className="text-sm font-medium text-bolt-elements-textPrimary">Loading settings...</span>
          </div>
        </div>
      }
    >
      {() => <SettingsPage />}
    </ClientOnly>
  );
}
