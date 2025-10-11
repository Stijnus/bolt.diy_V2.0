import * as React from 'react';

import { cn } from '~/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  uiSize?: 'sm' | 'md';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', uiSize = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex w-full rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textSecondary transition-theme focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-bolt-elements-borderColorActive',
          uiSize === 'sm' ? 'h-10 px-3 py-2 text-sm' : 'h-12 px-4 py-3 text-base',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
