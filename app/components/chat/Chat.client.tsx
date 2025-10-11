import { useChat } from '@ai-sdk/react';
import { useStore } from '@nanostores/react';
import type { UIMessage } from 'ai';
import { useAnimate } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, ToastContainer } from 'react-toastify';
import { BaseChat } from './BaseChat';
import { useAuth } from '~/lib/contexts/AuthContext';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { useChatHistory, chatId } from '~/lib/persistence';
import { revertMessagesToIndex } from '~/lib/persistence/chat-actions';
import { chatStore } from '~/lib/stores/chat';
import { currentModel } from '~/lib/stores/model';
import { settingsStore } from '~/lib/stores/settings';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FullModelId } from '~/types/model';
import { fileModificationsToHTML } from '~/utils/diff';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory } = useChatHistory();

  return (
    <>
      {ready && <ChatImpl initialMessages={initialMessages} storeMessageHistory={storeMessageHistory} />}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <X className="w-4 h-4" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <Check className="w-6 h-6 text-bolt-elements-icon-success" />;
            }
            case 'error': {
              return <AlertTriangle className="w-6 h-6 text-bolt-elements-icon-error" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

interface ChatProps {
  initialMessages: UIMessage[];
  storeMessageHistory: (messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>;
}

export const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  useShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);

  const { showChat, pendingInput } = useStore(chatStore);
  const modelSelection = useStore(currentModel);
  const settings = useStore(settingsStore);

  const [animationScope, animate] = useAnimate();

  const { messages, status, stop, sendMessage } = useChat({
    messages: initialMessages,
    body: {
      model: modelSelection.fullId,
      temperature: settings.ai.temperature,
      maxTokens: settings.ai.maxTokens,
    } as Record<string, unknown>,
  } as any);

  const isLoading = status === 'streaming';
  const [input, setInput] = useState('');
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value);

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  const { parsedMessages, parseMessages } = useMessageParser();

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  // Track the last saved message count to avoid re-saving and to ensure we capture all new messages
  const lastSavedCountRef = useRef(initialMessages.length);

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, []);

  // Handle pendingInput from error notifications (optionally auto-send)
  useEffect(() => {
    if (pendingInput) {
      const messageToSend = pendingInput;
      const shouldAutoSend = (chatStore.get() as any).autoSendPending === true;

      setInput(messageToSend);
      chatStore.setKey('pendingInput', undefined);
      chatStore.setKey('autoSendPending', false);

      // Focus the textarea and optionally auto-send
      setTimeout(() => {
        textareaRef.current?.focus();

        if (shouldAutoSend && messageToSend) {
          // Auto-send the prepared message
          sendMessageHandler({} as any, messageToSend);
        }
      }, 120);
    }
  }, [pendingInput]);

  useEffect(() => {
    parseMessages(messages, isLoading);
  }, [messages, isLoading]);

  // Save when streaming completes - single save point with proper timing
  useEffect(() => {
    /*
     * Only trigger save when:
     * 1. Streaming just finished (isLoading changed from true to false)
     * 2. We have new messages beyond what was initially loaded
     * 3. We haven't saved this many messages yet
     */
    if (!isLoading && messages.length > initialMessages.length && messages.length > lastSavedCountRef.current) {
      console.log(
        `[Chat] Streaming complete, scheduling save for ${messages.length} messages (last saved: ${lastSavedCountRef.current})`,
      );

      /*
       * Wait 2 seconds to ensure:
       * - Actions are parsed from AI response
       * - Actions are queued in ActionRunner
       * - Actions start executing in WebContainer
       * - Files are written to WebContainer
       * - FilesStore watcher detects changes
       * Then waitForFileOperations will wait for files to stabilize
       */
      const saveTimeoutId = setTimeout(() => {
        console.log(`[Chat] Starting save of ${messages.length} messages...`);
        storeMessageHistory(messages, modelSelection.fullId)
          .then(() => {
            lastSavedCountRef.current = messages.length;
            console.log(`[Chat] Successfully saved ${messages.length} messages`);
          })
          .catch((error) => {
            console.error('[Chat] Failed to store message history:', error);
          });
      }, 2000);

      return () => {
        console.log('[Chat] Cleaning up save timeout');
        clearTimeout(saveTimeoutId);
      };
    }

    return undefined;
  }, [isLoading, messages, modelSelection.fullId, initialMessages.length]);

  const scrollTextArea = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const abort = () => {
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
  };

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';

      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [input, textareaRef]);

  const runAnimation = async () => {
    if (chatStarted) {
      return;
    }

    // Check if elements exist before animating
    const examplesEl = document.querySelector('#examples');
    const introEl = document.querySelector('#intro');

    const animations = [];

    if (examplesEl) {
      animations.push(animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }));
    }

    if (introEl) {
      animations.push(animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }));
    }

    if (animations.length > 0) {
      await Promise.all(animations);
    }

    chatStore.setKey('started', true);

    setChatStarted(true);
  };

  const sendMessageHandler = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;

    if (_input.length === 0 || isLoading) {
      return;
    }

    // Clear input immediately to provide instant feedback
    setInput('');

    /**
     * @note (delm) Usually saving files shouldn't take long but it may take longer if there
     * many unsaved files. In that case we need to block user input and show an indicator
     * of some kind so the user is aware that something is happening. But I consider the
     * happy case to be no unsaved files and I would expect users to save their changes
     * before they send another message.
     */
    await workbenchStore.saveAllFiles();

    const fileModifications = workbenchStore.getFileModifcations();

    chatStore.setKey('aborted', false);

    runAnimation();

    let newMessage: any;

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);
      newMessage = { role: 'user', parts: [{ type: 'text', text: `${diff}\n\n${_input}` }] };
      await sendMessage(newMessage as any);
      workbenchStore.resetAllFileModifications();
    } else {
      newMessage = { role: 'user', parts: [{ type: 'text', text: _input }] };
      await sendMessage(newMessage as any);
    }

    // Note: Message history is now automatically saved by useEffect whenever messages change

    resetEnhancer();
    textareaRef.current?.blur();
  };

  const [messageRef, scrollRef] = useSnapScroll();

  const handleRevertMessage = async (index: number) => {
    const currentChatId = chatId.get();

    if (!currentChatId) {
      return;
    }

    const success = await revertMessagesToIndex(currentChatId, index, user?.id);

    if (success) {
      // Reload the page to refresh messages from database
      window.location.reload();
    }
  };

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading}
      enhancingPrompt={enhancingPrompt}
      promptEnhanced={promptEnhanced}
      sendMessage={sendMessageHandler}
      messageRef={messageRef}
      scrollRef={scrollRef}
      handleInputChange={handleInputChange}
      handleStop={abort}
      onRevertMessage={handleRevertMessage}
      messages={messages.map((message, i) => {
        if (message.role === 'user') {
          return message as UIMessage;
        }

        // for assistant messages, replace content text with parsedMessages, preserving other fields
        return {
          ...(message as any),

          // provide a simple text part for UIMessage in AI SDK v5
          parts: [{ type: 'text', text: parsedMessages[i] || '' }],
        } as UIMessage;
      })}
      enhancePrompt={() => {
        enhancePrompt(input, (input) => {
          setInput(input);
          scrollTextArea();
        });
      }}
    />
  );
});
