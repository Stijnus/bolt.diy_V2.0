import type { ReactNode } from 'react';

import { Badge } from '~/components/ui/Badge';

interface SettingsSectionProps {
  title: string;
  description?: string;
  status?: 'active' | 'session-only' | 'limited';
  children: ReactNode;
}

export function SettingsSection({ title, description, status, children }: SettingsSectionProps) {
  return (
    <div className="border-b border-bolt-elements-borderColor pb-8 last:border-b-0">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">{title}</h2>
          {status === 'session-only' && (
            <Badge variant="warning" className="text-xs">
              Session Only
            </Badge>
          )}
          {status === 'limited' && (
            <Badge variant="outline" className="text-xs">
              Limited
            </Badge>
          )}
          {status === 'active' && (
            <Badge variant="success" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-bolt-elements-textSecondary">{description}</p>}
        {status === 'session-only' && (
          <p className="mt-2 text-xs text-bolt-elements-textTertiary italic">
            These preferences affect the current browser session and are not fully persisted yet.
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
