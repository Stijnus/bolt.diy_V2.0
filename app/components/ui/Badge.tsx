import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary',
        primary:
          'border-transparent bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text shadow-sm',
        secondary:
          'border-transparent bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text',
        success: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
        warning: 'border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400',
        danger: 'border-transparent bg-bolt-elements-button-danger-background/15 text-bolt-elements-button-danger-text',
        outline: 'border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
