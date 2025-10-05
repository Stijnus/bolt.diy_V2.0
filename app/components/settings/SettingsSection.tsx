import type { ReactNode } from 'react';

import { Badge } from '~/components/ui/Badge';

interface SettingsSectionProps {
  title: string;
  description?: string;
  status?: 'implemented' | 'coming-soon' | 'partial';
  children: ReactNode;
}

export function SettingsSection({ title, description, status, children }: SettingsSectionProps) {
  return (
    <div className="border-b border-bolt-elements-borderColor pb-8 last:border-b-0">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">{title}</h2>
          {status === 'coming-soon' && (
            <Badge variant="warning" className="text-xs">
              Coming Soon
            </Badge>
          )}
          {status === 'partial' && (
            <Badge variant="outline" className="text-xs">
              Partially Implemented
            </Badge>
          )}
          {status === 'implemented' && (
            <Badge variant="success" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-bolt-elements-textSecondary">{description}</p>}
        {status === 'coming-soon' && (
          <p className="mt-2 text-xs text-bolt-elements-textTertiary italic">
            These settings are saved but not yet connected to functionality.
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
