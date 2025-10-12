import { useStore } from '@nanostores/react';
import { ClipboardList } from 'lucide-react';
import { memo } from 'react';
import { chatModeStore, setMode } from '~/lib/stores/chat-mode';
import { cn } from '~/lib/utils';

interface PlanModeToggleProps {
  show: boolean;
}

export const PlanModeToggle = memo(({ show }: PlanModeToggleProps) => {
  const { mode } = useStore(chatModeStore);
  const isPlanMode = mode === 'plan';

  const handleToggle = () => {
    setMode(isPlanMode ? 'normal' : 'plan');
  };

  return (
    <label
      className={cn(
        'group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer',
        'transition-all duration-300',
        'select-none',
        isPlanMode
          ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/40'
          : 'bg-bolt-elements-bg-depth-2 border-2 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive',
        !show && 'opacity-0 pointer-events-none',
      )}
      title={isPlanMode ? 'Disable Plan mode' : 'Enable Plan mode - AI will create a plan for your approval'}
    >
      <input type="checkbox" checked={isPlanMode} onChange={handleToggle} className="sr-only" />

      {/* Toggle Switch */}
      <div
        className={cn(
          'relative w-7 h-4 rounded-full transition-all duration-300',
          isPlanMode
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-md shadow-purple-500/50'
            : 'bg-bolt-elements-bg-depth-3',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm',
            'transition-all duration-300 ease-out',
            isPlanMode ? 'left-[14px]' : 'left-0.5',
          )}
        />
      </div>

      {/* Icon and Label */}
      <div className="flex items-center gap-1">
        <ClipboardList
          className={cn(
            'w-3 h-3 transition-colors',
            isPlanMode ? 'text-purple-400' : 'text-bolt-elements-textSecondary',
          )}
        />
        <span
          className={cn(
            'text-xs font-medium whitespace-nowrap transition-colors',
            isPlanMode ? 'text-purple-300' : 'text-bolt-elements-textPrimary',
          )}
        >
          Plan
        </span>
      </div>
    </label>
  );
});
