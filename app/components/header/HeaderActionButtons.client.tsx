import { useStore } from '@nanostores/react';
import { Code2, MessageSquare } from 'lucide-react';

import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  const canHideChat = showWorkbench || !showChat;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-1 shadow-sm">
      <Button
        active={showChat}
        disabled={!canHideChat}
        onClick={() => {
          if (canHideChat) {
            chatStore.setKey('showChat', !showChat);
          }
        }}
        label="Chat"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button
        active={showWorkbench}
        onClick={() => {
          if (showWorkbench && !showChat) {
            chatStore.setKey('showChat', true);
          }

          workbenchStore.showWorkbench.set(!showWorkbench);
        }}
        label="Code"
      >
        <Code2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  label?: string;
}

function Button({ active = false, disabled = false, children, onClick, label }: ButtonProps) {
  return (
    <button
      className={classNames(
        'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        {
          'bg-transparent text-bolt-elements-textTertiary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary':
            !active && !disabled,
          'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text shadow-sm':
            active && !disabled,
          'cursor-not-allowed opacity-40': disabled,
        },
      )}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
    >
      {children}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
