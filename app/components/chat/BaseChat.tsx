import type { UIMessage } from 'ai';
import { Loader2, Sparkles } from 'lucide-react';
import React, { type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import styles from './BaseChat.module.scss';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { MigrationBanner } from '~/components/migration/MigrationBanner';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: UIMessage[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-gradient-to-br from-bolt-elements-background-depth-1 via-bolt-elements-background-depth-1/95 to-bolt-elements-background-depth-2',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div
                id="intro"
                className="mx-auto mt-[14vh] flex w-full max-w-3xl flex-col items-center gap-8 px-6 text-center"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-bolt-elements-borderColor/80 bg-bolt-elements-background-depth-2/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-bolt-elements-textTertiary">
                  Powered by Bolt
                </span>
                <div className="space-y-4">
                  <h1 className="text-5xl font-semibold tracking-tight text-bolt-elements-textPrimary sm:text-6xl">
                    Where ideas begin and launch
                  </h1>
                  <p className="text-lg text-bolt-elements-textSecondary">
                    Design, develop, and deploy in one canvas. Craft a prompt, hand off tasks to Bolt, and iterate
                    together in real time.
                  </p>
                </div>
                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-1/80 px-5 py-4 text-left shadow-sm">
                    <p className="text-sm font-semibold text-bolt-elements-textPrimary">Instant previews</p>
                    <p className="mt-2 text-xs text-bolt-elements-textSecondary">
                      Run `/deploy` or drag in a repo to preview every change without leaving the chat.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-1/80 px-5 py-4 text-left shadow-sm">
                    <p className="text-sm font-semibold text-bolt-elements-textPrimary">Project memory</p>
                    <p className="mt-2 text-xs text-bolt-elements-textSecondary">
                      Bolt remembers your context, keeps track of files, and suggests next steps.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div
              className={classNames('px-6 pt-10 sm:pt-12', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => (
                  <div className="w-full max-w-chat mx-auto mb-4">
                    <MigrationBanner />
                  </div>
                )}
              </ClientOnly>
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-[1]"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative z-[2] mx-auto w-full max-w-chat', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <div className="rounded-3xl border border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-1/90 shadow-lg backdrop-blur-xl">
                  <textarea
                    ref={textareaRef}
                    className="w-full resize-none rounded-3xl border-none bg-transparent px-5 pb-5 pt-5 text-base text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="How can Bolt help you today?"
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex items-start justify-between px-5 pb-4 text-sm">
                    <div className="flex gap-1 items-center">
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames({
                          '!opacity-100': enhancingPrompt,
                          '!text-bolt-elements-item-contentAccent pr-1.5 enabled:hover:!bg-bolt-elements-item-backgroundAccent':
                            promptEnhanced,
                        })}
                        onClick={() => enhancePrompt?.()}
                      >
                        {enhancingPrompt ? (
                          <>
                            <Loader2 className="w-5 h-5 text-bolt-elements-loader-progress animate-spin" />
                            <div className="ml-1.5">Enhancing prompt...</div>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            {promptEnhanced && <div className="ml-1.5 text-xs">Prompt enhanced</div>}
                          </>
                        )}
                      </IconButton>
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-bolt-elements-textSecondary">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="pb-8" />
              </div>
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);
