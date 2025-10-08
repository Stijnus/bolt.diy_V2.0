import type { UIMessage } from 'ai';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Zap, Code2, Rocket } from 'lucide-react';
import React, { type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import styles from './BaseChat.module.scss';
import { Messages } from './Messages.client';
import { ModelSelector } from './ModelSelector';
import { SendButton } from './SendButton.client';
import { UsageStats } from './UsageStats';
import { Menu } from '~/components/sidebar/Menu.client';
import { AnimatedBadge } from '~/components/ui/AnimatedBadge';
import { FeatureCard } from '~/components/ui/FeatureCard';
import { GradientText } from '~/components/ui/GradientText';
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
              <motion.div
                id="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto mt-[12vh] flex w-full max-w-4xl flex-col items-center gap-10 px-6 text-center"
              >
                {/* Hero Badge */}
                <AnimatedBadge variant="pulse" pulse size="md" className="animate-slideInFromBottom">
                  <Sparkles className="h-3.5 w-3.5" />
                  BoltDIY V2.0
                </AnimatedBadge>

                {/* Hero Content */}
                <div className="space-y-6">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                  >
                    Where <GradientText>ideas begin</GradientText>
                    <br />
                    and launch
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mx-auto max-w-2xl text-lg text-bolt-elements-textSecondary sm:text-xl text-balance"
                  >
                    Design, develop, and deploy in one canvas. Craft a prompt, hand off tasks to AI, and iterate
                    together in real time with BoltDIY V2.0.
                  </motion.p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FeatureCard
                    icon={Zap}
                    title="Instant Previews"
                    description="See every change in real-time without leaving the chat. Deploy with a single command."
                    gradient
                    delay={0.3}
                  />
                  <FeatureCard
                    icon={Code2}
                    title="Smart Context"
                    description="BoltDIY remembers your project, tracks files, and suggests next steps intelligently."
                    gradient
                    delay={0.4}
                  />
                  <FeatureCard
                    icon={Rocket}
                    title="Ship Faster"
                    description="From idea to deployment in minutes. AI handles the heavy lifting while you focus on creativity."
                    gradient
                    delay={0.5}
                    className="sm:col-span-2 lg:col-span-1"
                  />
                </div>
              </motion.div>
            )}
            <div
              className={classNames('px-6 pt-10 sm:pt-12', {
                'h-full flex flex-col': chatStarted,
              })}
            >
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
                    placeholder="How can BoltDIY help you today?"
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
                      <ClientOnly>{() => <UsageStats />}</ClientOnly>
                    </div>
                    <div className="flex gap-3 items-center">
                      <ClientOnly>{() => <ModelSelector />}</ClientOnly>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textSecondary">
                          Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                        </div>
                      ) : null}
                    </div>
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
