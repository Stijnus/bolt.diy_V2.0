import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '~/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search conversations...',
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear and blur
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onChange]);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex items-center rounded-xl border-2 bg-bolt-elements-background-depth-1 transition-all',
          isFocused ? 'border-bolt-elements-borderColorActive shadow-md' : 'border-bolt-elements-borderColor shadow-sm',
        )}
      >
        <Search
          className={cn(
            'absolute left-3 h-4 w-4 transition-colors',
            isFocused ? 'text-bolt-elements-icon-primary' : 'text-bolt-elements-textTertiary',
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          className="h-10 w-full bg-transparent pl-10 pr-20 text-sm text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none"
          aria-label="Search conversations"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-bolt-elements-textTertiary transition-all hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd
            className={cn(
              'hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-all sm:inline-block',
              isFocused
                ? 'border-bolt-elements-borderColorActive bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary'
                : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary',
            )}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Results count hint */}
      {value && (
        <div className="mt-1.5 px-1 text-[11px] text-bolt-elements-textTertiary">
          Press{' '}
          <kbd className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-1 py-0.5">
            Esc
          </kbd>{' '}
          to clear
        </div>
      )}
    </div>
  );
}
