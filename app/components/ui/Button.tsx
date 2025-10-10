import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover focus-visible:ring-bolt-elements-borderColorActive shadow-sm hover:shadow-md',
        secondary:
          'bg-bolt-elements-button-secondary-background text-bolt-elements-textPrimary hover:bg-bolt-elements-button-secondary-backgroundHover focus-visible:ring-bolt-elements-borderColorActive shadow-sm',
        outline:
          'border-2 border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-2 focus-visible:ring-bolt-elements-borderColorActive hover:border-bolt-elements-borderColorActive',
        ghost:
          'bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
        subtle:
          'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor focus-visible:ring-bolt-elements-borderColorActive',
        danger:
          'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover focus-visible:ring-bolt-elements-button-danger-text shadow-sm hover:shadow-md',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref as any}
        className={cn(buttonVariants({ variant, size }), className)}
        {...(!asChild ? { type } : {})}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
