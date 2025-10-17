import { useStore } from '@nanostores/react';
import { Code2, LogIn, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { ConnectionStatus } from './ConnectionStatus';
import { LoginModal } from '~/components/auth/LoginModal';
import { ModelBadge } from '~/components/chat/ModelBadge';
import { ProjectContextBadge } from '~/components/projects/ProjectContextBadge';
import { ProjectSelector } from '~/components/projects/ProjectSelector';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { useAuth } from '~/lib/contexts/AuthContext';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

export function Header() {
  const chat = useStore(chatStore);
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const currentProjectId = useStore(workbenchStore.currentProjectId);
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
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
        <div className="flex items-center gap-2">
          <ClientOnly>{() => <ConnectionStatus />}</ClientOnly>
          <ClientOnly>{() => <ModelBadge />}</ClientOnly>

          {/* All interactive elements in consistent containers */}
          {chat.started && (
            <ClientOnly>
              {() => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (showWorkbench && !chat.showChat) {
                        chatStore.setKey('showChat', true);
                      }

                      workbenchStore.showWorkbench.set(!showWorkbench);
                    }}
                    className="flex items-center justify-center p-2 text-sm font-medium transition-all bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-button-primary-text hover:font-bold"
                    title="Toggle Code View"
                  >
                    <Code2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const canHideChat = showWorkbench || !chat.showChat;

                      if (canHideChat) {
                        chatStore.setKey('showChat', !chat.showChat);
                      }
                    }}
                    className="flex items-center justify-center p-2 text-sm font-medium transition-all bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-button-primary-text hover:font-bold"
                    disabled={!showWorkbench && chat.showChat}
                    title="Toggle Chat View"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <ThemeSwitch className="bg-transparent p-2 text-bolt-elements-textTertiary hover:text-bolt-elements-button-primary-text transition-all" />
                </div>
              )}
            </ClientOnly>
          )}

          {/* Sign In button when not logged in */}
          {!user && !chat.started && (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary transition-all hover:border-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-background hover:text-bolt-elements-button-primary-text hover:shadow-md"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
