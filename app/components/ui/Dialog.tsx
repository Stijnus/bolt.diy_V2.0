import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { memo, type ReactNode } from 'react';

import { IconButton } from './IconButton';
import { classNames } from '~/utils/classNames';

export { Close as DialogClose, Root as DialogRoot } from '@radix-ui/react-dialog';

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: (event: React.UIEvent) => void;
}

export const DialogButton = memo(({ type, children, onClick }: DialogButtonProps) => (
  <button
    className={classNames(
      'inline-flex h-[35px] items-center justify-center rounded-lg px-4 text-sm leading-none focus:outline-none',
      {
        'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover':
          type === 'primary',
        'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text hover:bg-bolt-elements-button-secondary-backgroundHover':
          type === 'secondary',
        'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover':
          type === 'danger',
      },
    )}
    onClick={onClick}
  >
    {children}
  </button>
));

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
      <RadixDialog.Overlay onClick={onBackdrop} className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm" />
      <RadixDialog.Content className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
        <div
          className={classNames(
            'relative max-h-[85vh] w-full max-w-[450px] overflow-hidden rounded-[var(--radius)] border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 shadow-xl focus:outline-none',
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
