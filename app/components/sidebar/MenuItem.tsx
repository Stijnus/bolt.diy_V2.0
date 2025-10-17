import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { cn } from '~/lib/utils';

interface MenuItemProps {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export const MenuItem = memo(({ icon, children, onClick, href, className }: MenuItemProps) => {
  const IconComponent = icon;

  const baseClasses = cn(
    'flex items-center gap-3 px-4 py-2.5 text-sm text-bolt-elements-textSecondary',
    'hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary',
    'transition-colors rounded-lg cursor-pointer',
    className,
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span>{children}</span>
    </button>
  );
});
