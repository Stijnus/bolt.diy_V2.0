import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';

import { ConnectionStatus } from './ConnectionStatus';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ModelBadge } from '~/components/chat/ModelBadge';
import { ProjectContextBadge } from '~/components/projects/ProjectContextBadge';
import { ProjectSelector } from '~/components/projects/ProjectSelector';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

export function Header() {
  const chat = useStore(chatStore);
  const currentProjectId = useStore(workbenchStore.currentProjectId);

  return (
    <header
      className={classNames(
        'flex items-center justify-between bg-bolt-elements-background-depth-1 px-6 py-3 h-[var(--header-height)] transition-colors',
        {
          'border-b border-transparent': !chat.started,
          'border-b border-bolt-elements-borderColor shadow-sm': chat.started,
        },
      )}
    >
      {/* Left Section - Project Context when active */}
      <div className="flex items-center gap-3 z-[998]">
        {currentProjectId && <ClientOnly>{() => <ProjectContextBadge />}</ClientOnly>}
      </div>

      {/* Center Section - Chat Description & Project Selector */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
        {!currentProjectId && <ClientOnly>{() => <ProjectSelector />}</ClientOnly>}
        <div className="max-w-md truncate text-center text-sm font-medium text-bolt-elements-textPrimary">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
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
