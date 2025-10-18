import { useStore } from '@nanostores/react';
import type { UIMessage } from 'ai';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Zap, Code2, Rocket, ClipboardList, MessageCircle } from 'lucide-react';
import React, { type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { ApiKeyStatus } from './ApiKeyStatus';
import styles from './BaseChat.module.scss';
import { DiscussionModeButton } from './DiscussionModeButton';
import { ImageUpload, type ImageAttachment } from './ImageUpload';
import { Messages } from './Messages.client';
import { PlanApprovalCard } from './PlanApprovalCard';
import { PlanModeToggle } from './PlanModeToggle';
import { ProviderModelSelector } from './ProviderModelSelector';
import { SendButton } from './SendButton.client';
import { UsageStats } from './UsageStats';
import { Menu } from '~/components/sidebar/Menu.client';
import { AnimatedBadge } from '~/components/ui/AnimatedBadge';
import { FeatureCard } from '~/components/ui/FeatureCard';
import { GradientText } from '~/components/ui/GradientText';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { chatModeStore } from '~/lib/stores/chat-mode';
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
  sendMessage?: (event: React.UIEvent, messageInput?: string, images?: ImageAttachment[]) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  onRevertMessage?: (index: number) => void;
  onPlanApprove?: (planContent: string) => void;
  onPlanReject?: () => void;
  images?: ImageAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
  supportsVision?: boolean;
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
      onRevertMessage,
      onPlanApprove,
      onPlanReject,
      images = [],
      onImagesChange,
      supportsVision = false,
    },
    ref,
  ) => {
    const { mode } = useStore(chatModeStore);
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
                transition={{ duration: 0.5 }}
                className="mx-auto mt-[8vh] flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center"
              >
                {/* Hero Badge - More Compact */}
                <AnimatedBadge variant="pulse" pulse size="sm" className="animate-slideInFromBottom">
                  <Sparkles className="h-3 w-3" />
                  BoltDIY V2.0
                </AnimatedBadge>

                {/* Hero Content - More Compact */}
                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight"
                  >
                    Where <GradientText>ideas begin</GradientText>
                    <br />
                    and launch
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto max-w-xl text-base text-bolt-elements-textSecondary sm:text-lg text-balance leading-relaxed"
                  >
                    Design, develop, and deploy in one canvas. Craft a prompt, hand off tasks to AI, and iterate
                    together in real time.
                  </motion.p>
                </div>

                {/* Feature Cards Grid - More Compact */}
                <div className="grid w-full gap-3 sm:grid-cols-3 mt-2">
                  <FeatureCard
                    icon={Zap}
                    title="Instant Previews"
                    description="See changes in real-time without leaving the chat."
                    gradient
                    delay={0.3}
                    compact
                  />
                  <FeatureCard
                    icon={Code2}
                    title="Smart Context"
                    description="AI remembers your project and suggests next steps."
                    gradient
                    delay={0.4}
                    compact
                  />
                  <FeatureCard
                    icon={Rocket}
                    title="Ship Faster"
                    description="From idea to deployment in minutes with AI."
                    gradient
                    delay={0.5}
                    compact
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
                      onRevertMessage={onRevertMessage}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative z-[2] mx-auto w-full max-w-chat', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <ClientOnly>
                  {() => (
                    <PlanApprovalCard
                      onApprove={(planContent) => onPlanApprove?.(planContent)}
                      onReject={() => onPlanReject?.()}
                    />
                  )}
                </ClientOnly>
                {mode !== 'normal' && (
                  <div className="mb-4 px-5 py-3 rounded-2xl bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 border-2 border-bolt-elements-borderColor shadow-md backdrop-blur-xl animate-slideUp">
                    <p className="text-sm text-bolt-elements-textPrimary text-center font-medium">
                      {mode === 'plan' ? (
                        <>
                          <ClipboardList className="inline w-4 h-4 mr-2 text-purple-400" />
                          <span className="text-purple-300">Plan mode active</span> - AI will create a plan for your
                          approval before executing actions
                        </>
                      ) : (
                        <>
                          <MessageCircle className="inline w-4 h-4 mr-2 text-green-400" />
                          <span className="text-green-300">Discussion mode active</span> - AI will provide advice
                          without executing actions
                        </>
                      )}
                    </p>
                  </div>
                )}
                {/* API Key Status */}
                <div className="mb-3">
                  <ClientOnly>{() => <ApiKeyStatus />}</ClientOnly>
                </div>
                {/* Provider and Model Selectors */}
                <div className="mb-4 flex justify-center">
                  <div className="w-full max-w-3xl">
                    <ClientOnly>{() => <ProviderModelSelector />}</ClientOnly>
                  </div>
                </div>
                <div className="rounded-3xl border-2 border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-bolt-elements-borderColorActive hover:shadow-[0_0_30px_rgba(45,166,255,0.15)]">
                  <textarea
                    ref={textareaRef}
                    className="w-full resize-none rounded-3xl border-none bg-transparent px-6 pb-6 pt-6 text-base text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessage?.(event, undefined, images);
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
                  <div className="relative">
                    <ClientOnly>
                      {() => (
                        <SendButton
                          show={input.length > 0 || isStreaming || images.length > 0}
                          isStreaming={isStreaming}
                          onClick={(event) => {
                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            sendMessage?.(event, undefined, images);
                          }}
                        />
                      )}
                    </ClientOnly>
                  </div>
                  <div className="flex items-center justify-between px-6 pb-5">
                    <div className="flex gap-1 items-center">
                      {/* Icon-only buttons */}
                      {supportsVision && onImagesChange && (
                        <ImageUpload
                          images={images}
                          onImagesChange={onImagesChange}
                          disabled={isStreaming}
                        />
                      )}
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames('transition-colors', {
                          '!opacity-100': enhancingPrompt,
                          '!text-bolt-elements-item-contentAccent enabled:hover:!bg-bolt-elements-item-backgroundAccent':
                            promptEnhanced,
                        })}
                        onClick={() => enhancePrompt?.()}
                      >
                        {enhancingPrompt ? (
                          <Loader2 className="w-5 h-5 text-bolt-elements-loader-progress animate-spin" />
                        ) : (
                          <Sparkles className="h-5 w-5" />
                        )}
                      </IconButton>
                      <ClientOnly>{() => <UsageStats />}</ClientOnly>
                      <ClientOnly>{() => <DiscussionModeButton show={chatStarted && mode !== 'plan'} />}</ClientOnly>
                      <ClientOnly>{() => <PlanModeToggle show={input.length > 0 && !isStreaming} />}</ClientOnly>
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
