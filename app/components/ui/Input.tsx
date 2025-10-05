import * as React from 'react';

import { cn } from '~/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-2 text-sm text-bolt-elements-textPrimary shadow-sm transition-all duration-300 placeholder:text-bolt-elements-textTertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-bolt-elements-borderColorActive focus-visible:ring-offset-0 focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 hover:border-bolt-elements-borderColorActive/50',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
