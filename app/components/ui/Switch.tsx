import { classNames } from '~/utils/classNames';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, disabled = false, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={classNames(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background focus-visible:ring-offset-2 focus-visible:ring-offset-bolt-elements-background-depth-1',
        {
          'bg-bolt-elements-button-primary-background': checked && !disabled,
          'bg-bolt-elements-background-depth-3': !checked && !disabled,
          'opacity-50 cursor-not-allowed': disabled,
        },
        className,
      )}
    >
      <span
        className={classNames('inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform', {
          'translate-x-6': checked,
          'translate-x-1': !checked,
        })}
      />
    </button>
  );
}
