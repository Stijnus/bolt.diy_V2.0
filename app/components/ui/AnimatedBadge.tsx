import * as React from 'react';

import { cn } from '~/lib/utils';

interface AnimatedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const variantStyles = {
  default: 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary border-bolt-elements-borderColor',
  success: 'bg-bolt-elements-icon-success/10 text-bolt-elements-icon-success border-bolt-elements-icon-success/30',
  error: 'bg-bolt-elements-icon-error/10 text-bolt-elements-icon-error border-bolt-elements-icon-error/30',
  warning: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  pulse: 'bg-primary/10 text-primary border-primary/30',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const AnimatedBadge = React.forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border font-semibold transition-all',
          variantStyles[variant],
          sizeStyles[size],
          pulse && 'animate-pulse',
          className,
        )}
        {...props}
      >
        {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
        {children}
      </span>
    );
  },
);

AnimatedBadge.displayName = 'AnimatedBadge';
