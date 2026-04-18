import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '~/lib/utils';

type SwitchProps = Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, 'onChange'> & {
  onChange?: (checked: boolean) => void;
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, onChange, onCheckedChange, ...props }, ref) => (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-bolt-elements-button-primary-background data-[state=unchecked]:bg-bolt-elements-background-depth-3',
        className,
      )}
      onCheckedChange={(checked) => {
        onCheckedChange?.(checked);
        onChange?.(checked);
      }}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-bolt-elements-background-depth-1 shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1',
        )}
      />
    </SwitchPrimitives.Root>
  ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
