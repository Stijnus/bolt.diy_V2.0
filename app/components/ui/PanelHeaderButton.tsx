import React, { forwardRef, memo } from 'react';
import { classNames } from '~/utils/classNames';

type PanelHeaderButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  disabledClassName?: string;
};

export const PanelHeaderButton = memo(
  forwardRef<HTMLButtonElement, PanelHeaderButtonProps>(
    ({ className, disabledClassName, disabled = false, children, onClick, ...props }, ref) => {
      return (
        <button
          ref={ref}
          className={classNames(
            'flex items-center shrink-0 gap-1.5 px-1.5 rounded-md py-0.5 text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed',
            {
              [classNames('opacity-30', disabledClassName)]: disabled,
            },
            className,
          )}
          disabled={disabled}
          onClick={(event) => {
            if (disabled) {
              return;
            }

            onClick?.(event);
          }}
          {...props}
        >
          {children}
        </button>
      );
    },
  ),
);
