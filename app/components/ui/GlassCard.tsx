import * as React from 'react';

import { cn } from '~/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  blur?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  light: 'glass',
  dark: 'glass-dark',
};

const blurStyles = {
  sm: '[backdrop-filter:blur(8px)]',
  md: '[backdrop-filter:blur(12px)]',
  lg: '[backdrop-filter:blur(16px)]',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', blur = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-6 shadow-lg transition-all duration-300',
          variantStyles[variant],
          blurStyles[blur],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = 'GlassCard';
