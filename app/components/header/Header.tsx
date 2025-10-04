import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { UserMenu } from '~/components/auth/UserMenu';
import { PanelLeft } from 'lucide-react';

export function Header() {
  const chat = useStore(chatStore);
  const theme = useStore(themeStore);

  return (
    <header
      className={classNames(
        'flex items-center bg-bolt-elements-background-depth-1 p-5 border-b h-[var(--header-height)]',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <PanelLeft className="w-5 h-5" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <img
            src="/logo.svg"
            alt="BoltDYI"
            className="h-8"
          />
        </a>
      </div>
      <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </span>
      <div className="flex items-center gap-2">
        {chat.started && (
          <ClientOnly>
            {() => (
              <div className="mr-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        )}
        <ClientOnly>
          {() => <UserMenu />}
        </ClientOnly>
      </div>
    </header>
  );
}
