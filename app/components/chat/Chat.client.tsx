import { useChat } from '@ai-sdk/react';
import { useStore } from '@nanostores/react';
import type { UIMessage } from 'ai';
import { useAnimate } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { BaseChat } from './BaseChat';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { getDatabase, saveUsage, chatId, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { currentModel, setChatModel } from '~/lib/stores/model';
import { $sessionUsage, addUsage, resetSessionUsage } from '~/lib/stores/usage';
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

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);

  const { showChat } = useStore(chatStore);
  const modelSelection = useStore(currentModel);
  const activeChatId = useStore(chatId);

  const [animationScope, animate] = useAnimate();

  const { messages, status, stop, sendMessage } = useChat({
    messages: initialMessages,
    body: {
      model: modelSelection.fullId,
    },
    onFinish: (result) => {
      if (result.usage && (result.usage.promptTokens > 0 || result.usage.completionTokens > 0)) {
        // `usage` is extended in `stream-text.ts` to include cost, provider, and modelId
        addUsage(result.usage as any);
      }
    },
  });

  const isLoading = status === 'streaming';
  const [input, setInput] = useState('');
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value);

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  const { parsedMessages, parseMessages } = useMessageParser();

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, []);

  useEffect(() => {
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages, modelSelection.fullId).catch((error) => toast.error(error.message));
    }
  }, [messages, isLoading, parseMessages, initialMessages.length, modelSelection.fullId, storeMessageHistory]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    setChatModel(activeChatId, modelSelection.provider, modelSelection.modelId);
  }, [activeChatId, modelSelection.provider, modelSelection.modelId]);

  useEffect(() => {
    if (!activeChatId || messages.length === 0) {
      return;
    }

    storeMessageHistory(messages, modelSelection.fullId).catch((error) => {
      console.warn('Failed to persist model preference', error);
    });
  }, [activeChatId, modelSelection.fullId, storeMessageHistory]);

  useEffect(() => {
    // When a new chat is loaded, reset the session usage counter.
    resetSessionUsage();

    return () => {
      // When the chat session changes (e.g., navigating to a new chat),
      // save the accumulated usage data for the completed session to IndexedDB.
      const finalUsage = $sessionUsage.get();
      if (finalUsage.tokens.input > 0 || finalUsage.tokens.output > 0) {
        getDatabase().then((db) => {
          if (db) {
            saveUsage(db, finalUsage).catch((err) => {
              console.error('Failed to save usage data', err);
              toast.error('Could not save usage statistics.');
            });
          }
        });
      }
    };
  }, [activeChatId]); // This effect re-runs whenever the chat ID changes.

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

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);
      await sendMessage({ role: 'user', parts: [{ type: 'text', text: `${diff}\n\n${_input}` }] } as any);
      workbenchStore.resetAllFileModifications();
    } else {
      await sendMessage({ role: 'user', parts: [{ type: 'text', text: _input }] } as any);
    }

    setInput('');
    resetEnhancer();
    textareaRef.current?.blur();
  };

  const [messageRef, scrollRef] = useSnapScroll();

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