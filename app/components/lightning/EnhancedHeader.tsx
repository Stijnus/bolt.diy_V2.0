import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';

import { HeaderActionButtons } from '../header/HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { LightningLogo, ElectricNavItem } from './LightningEffects';

export function EnhancedHeader() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center justify-between bg-bolt-elements-background-depth-1 px-6 py-3 h-[var(--header-height)] transition-colors backdrop-blur-sm',
        {
          'border-b border-transparent': !chat.started,
          'border-b border-bolt-elements-borderColor shadow-sm': chat.started,
        },
      )}
    >
      {/* Logo Section with Lightning Effect */}
      <div className="flex items-center gap-3 z-[998]">
        <div className="flex items-center gap-2">
          <LightningLogo size={28} className="animate-lightning-strike" />
          <span className="font-bold text-xl">
            <span className="electric-text" data-text="BoltDIY">BoltDIY</span>
          </span>
        </div>
        
        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          <ElectricNavItem>
            Projects
          </ElectricNavItem>
          <ElectricNavItem>
            Templates
          </ElectricNavItem>
          <ElectricNavItem>
            Docs
          </ElectricNavItem>
        </nav>
      </div>

      {/* Center Section - Chat Description */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md">
        <div className="truncate text-center text-sm font-medium text-bolt-elements-textPrimary">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-3">
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
