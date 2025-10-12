import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Tooltip } from '~/components/ui/Tooltip';
import { classNames } from '~/utils/classNames';

interface SettingItemProps {
  label: string;
  description?: string;
  tooltip?: string;
  children: ReactNode;
  error?: string;
}

export function SettingItem({ label, description, tooltip, children, error }: SettingItemProps) {
  return (
    <div
      className={classNames(
        'flex items-center justify-between rounded-[calc(var(--radius))] border px-4 py-3 transition-theme',
        error
          ? 'border-bolt-elements-button-danger-text bg-bolt-elements-button-danger-background/10'
          : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:border-bolt-elements-borderColorActive',
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-bolt-elements-textPrimary">{label}</label>
          {tooltip && (
            <Tooltip content={tooltip} side="right">
              <button type="button" className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary">
                <HelpCircle className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
        {description && <p className="mt-0.5 text-xs text-bolt-elements-textSecondary">{description}</p>}
        {error && <p className="mt-1 text-xs font-medium text-bolt-elements-button-danger-text">{error}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}
