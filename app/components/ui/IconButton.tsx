import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface BaseIconButtonProps {
  size?: IconSize;
  className?: string;
  iconClassName?: string;
  disabledClassName?: string;
  title?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

type IconButtonWithIconProps = {
  icon: LucideIcon;
  children?: undefined;
} & BaseIconButtonProps;

type IconButtonWithChildrenProps = {
  icon?: undefined;
  children: React.ReactNode;
} & BaseIconButtonProps;

type IconButtonProps = IconButtonWithIconProps | IconButtonWithChildrenProps;

export const IconButton = memo(
  ({
    icon: Icon,
    size = 'xl',
    className,
    iconClassName,
    disabledClassName,
    disabled = false,
    title,
    onClick,
    children,
  }: IconButtonProps) => {
    return (
      <button
        className={cn(
          'flex items-center text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive rounded-md p-1 enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed',
          disabled && cn('opacity-30', disabledClassName),
          className,
        )}
        title={title}
        disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            return;
          }

          onClick?.(event);
        }}
      >
        {children ? children : Icon && <Icon className={cn(getIconSize(size), iconClassName)} />}
      </button>
    );
  },
);

function getIconSize(size: IconSize) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
    xxl: 'w-8 h-8',
  };

  return sizeMap[size];
}
