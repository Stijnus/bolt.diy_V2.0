import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Tooltip } from '~/components/ui/Tooltip';

interface SettingItemProps {
  label: string;
  description?: string;
  tooltip?: string;
  children: ReactNode;
}

export function SettingItem({ label, description, tooltip, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 py-3 transition-theme hover:border-bolt-elements-borderColorActive">
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
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}
