import type { ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface SettingCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * SettingCard is a reusable container component for grouping related settings.
 * It provides consistent styling and optional title/description.
 */
export function SettingCard({ title, description, children, variant = 'default', size = 'md', className }: SettingCardProps) {
  return (
    <div
      className={classNames(
        'rounded-[calc(var(--radius))] border transition-theme animate-scaleIn',
        size === 'sm' ? 'p-4' : 'p-6',
        variant === 'danger'
          ? 'border-bolt-elements-button-danger-text/30 bg-bolt-elements-background-depth-2 hover:border-bolt-elements-button-danger-text/50 hover:bg-bolt-elements-button-danger-background/5'
          : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-borderColorActive',
        className,
      )}
    >
      {title && (
        <div className="mb-4">
          <h3
            className={classNames(
              'text-base font-semibold',
              variant === 'danger' ? 'text-bolt-elements-button-danger-text' : 'text-bolt-elements-textPrimary',
            )}
          >
            {title}
          </h3>
          {description && <p className="mt-1 text-sm text-bolt-elements-textSecondary">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
