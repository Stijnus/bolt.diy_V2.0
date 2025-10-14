import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '~/components/ui/Badge';

interface SettingsSectionProps {
  title: string;
  description?: string;
  status?: 'implemented' | 'coming-soon' | 'partial';
  children: ReactNode;
  onReset?: () => void;
  onRevert?: () => void;
  dirty?: boolean;
}

export function SettingsSection({
  title,
  description,
  status,
  children,
  onReset,
  onRevert,
  dirty = false,
}: SettingsSectionProps) {
  return (
    <div className="border-b border-bolt-elements-borderColor pb-8 last:border-b-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
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
          {(onReset || onRevert) && (
            <div className="flex items-center gap-2">
              {onRevert && dirty && (
                <button
                  onClick={onRevert}
                  className="rounded-[calc(var(--radius))] px-3 py-1.5 text-sm font-medium text-bolt-elements-textSecondary transition-theme hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
                  type="button"
                >
                  Discard
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 rounded-[calc(var(--radius))] px-3 py-1.5 text-sm font-medium text-bolt-elements-textSecondary transition-theme hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
                  title="Reset to defaults"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
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
