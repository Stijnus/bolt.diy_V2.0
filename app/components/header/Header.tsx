import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';

import { ConnectionStatus } from './ConnectionStatus';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ModelBadge } from '~/components/chat/ModelBadge';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'grid grid-cols-[1fr_auto_1fr] items-center bg-bolt-elements-background-depth-1 px-6 py-3 h-[var(--header-height)] transition-colors gap-4',
        {
          'border-b border-transparent': !chat.started,
          'border-b border-bolt-elements-borderColor shadow-sm': chat.started,
        },
      )}
    >
      <div aria-hidden="true" />

      <div className="min-w-0 max-w-xl justify-self-center">
        <div className="truncate text-center text-sm font-medium text-bolt-elements-textPrimary">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-self-end">
        <ClientOnly>{() => <ConnectionStatus />}</ClientOnly>
        <ClientOnly>{() => <ModelBadge />}</ClientOnly>
        {chat.started && (
          <ClientOnly>
            {() => (
              <div className="mr-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        )}
      </div>
    </header>
  );
}
