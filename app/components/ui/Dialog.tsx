import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { memo, type ReactNode } from 'react';

import { Button } from './Button';
import { IconButton } from './IconButton';
import { classNames } from '~/utils/classNames';

export { Root as DialogRoot } from '@radix-ui/react-dialog';

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const DialogButton = memo(({ type, children, onClick }: DialogButtonProps) => {
  const variant = type === 'danger' ? 'danger' : type === 'secondary' ? 'secondary' : 'primary';

  return (
    <Button variant={variant} className="h-[35px] px-4 text-sm leading-none" onClick={onClick}>
      {children}
    </Button>
  );
});

export const DialogTitle = memo(({ className, children, ...props }: RadixDialog.DialogTitleProps) => (
  <RadixDialog.Title
    className={classNames(
      'px-5 py-4 flex items-center justify-between border-b border-bolt-elements-borderColor text-lg font-semibold leading-6 text-bolt-elements-textPrimary',
      className,
    )}
    {...props}
  >
    {children}
  </RadixDialog.Title>
));

export const DialogDescription = memo(({ className, children, ...props }: RadixDialog.DialogDescriptionProps) => (
  <RadixDialog.Description
    className={classNames('px-5 py-4 text-bolt-elements-textPrimary text-base', className)}
    {...props}
  >
    {children}
  </RadixDialog.Description>
));

interface DialogProps {
  children: ReactNode | ReactNode[];
  className?: string;
  onBackdrop?: (event: React.UIEvent) => void;
  onClose?: (event: React.UIEvent) => void;
}

export const Dialog = memo(({ className, children, onBackdrop, onClose }: DialogProps) => {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay onClick={onBackdrop} className="fixed inset-0 z-[999] bg-black/55 backdrop-blur-sm" />
      <RadixDialog.Content className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
        <div
          className={classNames(
            'relative max-h-[85vh] w-full max-w-[450px] overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 shadow-2xl focus:outline-none',
            className,
          )}
          style={{ backgroundColor: 'var(--bolt-elements-bg-depth-1)' }}
        >
          {children}
          <RadixDialog.Close asChild onClick={onClose}>
            <IconButton icon={X} className="absolute right-3 top-3 z-10" />
          </RadixDialog.Close>
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
