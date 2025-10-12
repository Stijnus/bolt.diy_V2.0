import { useChat } from '@ai-sdk/react';
import { useStore } from '@nanostores/react';
import type { UIMessage } from 'ai';
import { useAnimate } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, ToastContainer, toast } from 'react-toastify';
import { BaseChat } from './BaseChat';
import { useAuth } from '~/lib/contexts/AuthContext';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { useChatHistory, chatId } from '~/lib/persistence';
import { revertMessagesToIndex } from '~/lib/persistence/chat-actions';
import { chatStore } from '~/lib/stores/chat';
import { chatModeStore, setPendingPlan } from '~/lib/stores/chat-mode';
import { currentModel } from '~/lib/stores/model';
import { settingsStore } from '~/lib/stores/settings';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FullModelId } from '~/types/model';
import { fileModificationsToHTML } from '~/utils/diff';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { detectMarkdownPlan, formatPlanToMarkdown } from '~/utils/plan-format';

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
  const { mode, pendingPlan } = useStore(chatModeStore);
  const modelSelection = useStore(currentModel);
  const settings = useStore(settingsStore);

  const [animationScope, animate] = useAnimate();

  const { messages, status, stop, sendMessage } = useChat({
    messages: initialMessages,
    body: {
      model: mode === 'plan' && settings.ai.planModel ? (settings.ai.planModel as FullModelId) : modelSelection.fullId,
      temperature: settings.ai.temperature,
      maxTokens: settings.ai.maxTokens,
      mode, // Pass current chat mode to API
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

    // Detect plan generation in plan mode
    if (mode === 'plan' && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.role === 'assistant') {
        const content = Array.isArray((lastMessage as any).parts)
          ? (lastMessage as any).parts
              .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
              .map((p: any) => p.text)
              .join('')
          : ((lastMessage as any).content ?? '');

        /*
         * In Plan mode, always capture the assistant's response as the pending plan.
         * Prefer explicit <plan_document> marker if present; otherwise use full content.
         */
        if (content && mode === 'plan') {
          if (pendingPlan?.messageId === lastMessage.id) {
            return;
          }

          const hasPlanMarker = /<plan_document[\s>]/i.test(content) || detectMarkdownPlan(content);
          const hasForbiddenTags = /<(boltArtifact|boltAction)\b/i.test(content);

          if (hasPlanMarker && !hasForbiddenTags) {
            setPendingPlan(lastMessage.id, content, Date.now());
          }
        }
      }
    }
  }, [messages, isLoading, mode, pendingPlan?.messageId]);

  /*
   * Enforce plan-only output: if assistant response lacks <plan_document> or includes artifacts,
   * send a one-time follow-up requesting proper plan formatting.
   */
  useEffect(() => {
    if (mode !== 'plan' || isLoading || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1] as any;

    if (!lastMessage || lastMessage.role !== 'assistant') {
      return;
    }

    const content = Array.isArray(lastMessage.parts)
      ? lastMessage.parts
          .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')
      : (lastMessage.content ?? '');

    const hasPlan = /<plan_document[\s>]/i.test(content) || detectMarkdownPlan(content);
    const hasArtifacts = /<(boltArtifact|boltAction)\b/i.test(content);
    // Non-compliant if any XML-like tags other than <plan_document> are present
    const extraneousXmlTags = /<(?!\/?plan_document\b)[a-zA-Z][\w:-]*(\s[^>]*)?>/i.test(content);

    if ((!hasPlan || hasArtifacts || extraneousXmlTags) && planEnforceCountRef.current < 2) {
      planEnforceCountRef.current += 1;

      const reformatRequest = [
        'Your previous reply did not follow PLAN MODE.',
        'Return ONLY a <plan_document> with these sections:',
        'Overview, Architecture, Files to Create/Modify (path → purpose), Dependencies (versions),',
        'Commands (ordered), Implementation Steps (numbered), Risks & Assumptions, Acceptance Criteria.',
        'FORBIDDEN: <boltArtifact>, <boltAction>, or any other XML tags. Do not execute anything.',
      ].join(' ');

      // Send a lightweight user message asking for compliant plan output
      void sendMessage({ role: 'user', parts: [{ type: 'text', text: reformatRequest }] } as any);
    } else if ((!hasPlan || hasArtifacts || extraneousXmlTags) && planEnforceCountRef.current >= 2) {
      toast.error('Plan mode response could not be validated after multiple attempts. Please adjust your request or exit plan mode.');
    }
  }, [messages, isLoading, mode]);

  useEffect(() => {
    if (mode !== 'discussion' || isLoading || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1] as any;

    if (!lastMessage || lastMessage.role !== 'assistant') {
      return;
    }

    const content = Array.isArray(lastMessage.parts)
      ? lastMessage.parts
          .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')
      : (lastMessage.content ?? '');

    if (/<(boltArtifact|boltAction)\b/i.test(content)) {
      toast.warn('Discussion mode ignores generated actions. Ask for guidance or switch to plan/normal mode to execute.');
    }
  }, [messages, isLoading, mode]);

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

  const planEnforceCountRef = useRef(0);

  const containsPlanApprovalTag = (_text: string) => /<approved_plan[\s>]/i.test(_text);
  const containsPlanDocumentTag = (_text: string) => /<plan_document[\s>]/i.test(_text);

  const sendMessageHandler = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;

    if (_input.length === 0 || isLoading) {
      return;
    }

    if (mode === 'discussion' && containsPlanApprovalTag(_input)) {
      toast.warn('Approved plan markers are disabled in discussion mode. Switch to normal mode to execute plans.');
      return;
    }

    if (mode === 'plan' && containsPlanDocumentTag(_input)) {
      toast.info('User-supplied plan documents are ignored while plan mode is generating a plan.');
    }

    // Reset plan enforcement counter for this new user turn
    planEnforceCountRef.current = 0;

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

  const handlePlanApprove = (planContent: string) => {
    // Send a follow-up message to execute the approved plan deterministically
    const executionMessage = `Implement the following approved plan exactly as-is. Do not re-plan.\n\n<approved_plan>\n${formatPlanToMarkdown(planContent)}\n</approved_plan>`;
    sendMessageHandler({} as any, executionMessage);
  };

  const handlePlanReject = () => {
    // User can provide feedback in the chat input

    setInput('I would like to revise the plan. ');
    textareaRef.current?.focus();
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
      onPlanApprove={handlePlanApprove}
      onPlanReject={handlePlanReject}
      messages={(function buildMessages() {
        const base = messages.map((message, i) => {
          if (message.role === 'user') {
            return message as UIMessage;
          }

          return {
            ...(message as any),
            parts: [{ type: 'text', text: parsedMessages[i] || '' }],
          } as UIMessage;
        });

        if (mode === 'plan' && pendingPlan?.content) {
          base.push({
            role: 'assistant',
            parts: [{ type: 'text', text: formatPlanToMarkdown(pendingPlan.content) }],
          } as UIMessage);
        }

        return base;
      })()}
      enhancePrompt={() => {
        enhancePrompt(input, (input) => {
          setInput(input);
          scrollTextArea();
        });
      }}
    />
  );
});
