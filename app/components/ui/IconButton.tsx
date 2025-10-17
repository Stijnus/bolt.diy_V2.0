import type { LucideIcon } from 'lucide-react';
import { forwardRef, memo } from 'react';
import type React from 'react';
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

// Allow passing through any standard button attributes (e.g. aria-*, data-*, onPointerDown) from wrappers like Radix
type IconButtonAllProps = IconButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

const IconButtonBase = (
  {
    icon: iconComponent,
    size = 'xl',
    className,
    iconClassName,
    disabledClassName,
    disabled = false,
    title,
    onClick,
    children,
    ...rest
  }: IconButtonAllProps,
  ref: React.Ref<HTMLButtonElement>,
) => {
  const IconComponent = iconComponent;

  return (
    <button
      ref={ref}
      className={cn(
        'flex items-center text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-button-primary-text enabled:hover:font-bold p-1 disabled:cursor-not-allowed',
        disabled && cn('opacity-30', disabledClassName),
        className,
      )}
      title={title}
      disabled={disabled}
      {...rest}
      onClick={(event) => {
        if (disabled) {
          return;
        }

        onClick?.(event);
      }}
    >
      {children ? children : IconComponent && <IconComponent className={cn(getIconSize(size), iconClassName)} />}
    </button>
  );
};

const ForwardedIconButton = forwardRef<HTMLButtonElement, IconButtonAllProps>(IconButtonBase);

export const IconButton = memo(ForwardedIconButton);

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
