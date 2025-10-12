import { useStore } from '@nanostores/react';
import { MessageCircle } from 'lucide-react';
import { memo } from 'react';
import { chatModeStore, setMode } from '~/lib/stores/chat-mode';
import { cn } from '~/lib/utils';

interface DiscussionModeButtonProps {
  show: boolean;
}

export const DiscussionModeButton = memo(({ show }: DiscussionModeButtonProps) => {
  const { mode } = useStore(chatModeStore);
  const isDiscussionMode = mode === 'discussion';

  if (!show) {
    return null;
  }

  const handleToggle = () => {
    setMode(isDiscussionMode ? 'normal' : 'discussion');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl',
        'transition-all duration-300',
        'text-xs font-medium',
        'border-2',
        'focus-visible:outline-none focus-visible:ring-2',
        isDiscussionMode
          ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/40 text-green-300 shadow-md shadow-green-500/20 focus-visible:ring-green-500/50'
          : 'bg-bolt-elements-bg-depth-2 border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive focus-visible:ring-bolt-elements-borderColorActive',
      )}
      title={
        isDiscussionMode
          ? 'Switch back to Normal mode'
          : 'Discussion mode - AI provides advice without executing actions'
      }
    >
      <div
        className={cn(
          'w-5 h-5 rounded-lg flex items-center justify-center transition-all',
          isDiscussionMode ? 'bg-gradient-to-br from-green-500/30 to-green-600/20' : 'bg-bolt-elements-bg-depth-3',
        )}
      >
        <MessageCircle
          className={cn(
            'w-3 h-3 transition-all',
            isDiscussionMode
              ? 'text-green-400'
              : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary',
          )}
        />
      </div>
      <span className="whitespace-nowrap">{isDiscussionMode ? 'Discussion' : 'Discuss'}</span>
    </button>
  );
});
