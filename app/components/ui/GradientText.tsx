import * as React from 'react';

import { cn } from '~/lib/utils';

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'rainbow';
}

const gradientVariants = {
  primary: 'gradient-text-primary',
  success: 'bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent',
  rainbow: 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent',
};

export const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn('font-bold', gradientVariants[variant], className)} {...props}>
        {children}
      </span>
    );
  },
);

GradientText.displayName = 'GradientText';
