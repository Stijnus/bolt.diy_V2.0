import type { UIMessage } from 'ai';
import { useCallback, useState } from 'react';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');

// Flag to skip action execution when parsing imported chats
let skipActionExecution = false;

const messageParser = new StreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      logger.trace('onArtifactOpen', data);

      /*
       * Always show workbench and create artifact (for UI display)
       * But the artifact will have an ActionRunner that won't execute actions if imported
       */
      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      logger.trace('onArtifactClose');

      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      logger.trace('onActionOpen', data.action);

      if (skipActionExecution) {
        logger.debug('Skipping action execution for imported chat:', data.action.type);
        return;
      }

      // we only add shell actions when when the close tag got parsed because only then we have the content
      if (data.action.type !== 'shell') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      logger.trace('onActionClose', data.action);

      if (skipActionExecution) {
        logger.debug('Skipping action execution for imported chat');
        return;
      }

      if (data.action.type === 'shell') {
        workbenchStore.addAction(data);
      }

      workbenchStore.runAction(data);
    },
  },
});

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<{ [key: number]: string }>({});
  const [isImportedChat, setIsImportedChat] = useState(false);

  const parseMessages = useCallback(
    (messages: UIMessage[], isLoading: boolean) => {
      let reset = false;

      if (import.meta.env.DEV && !isLoading) {
        reset = true;
        messageParser.reset();
      }

      /*
       * Detect if this is an imported chat (initial messages loaded from history)
       * If so, we should NOT execute actions, only parse for display
       */
      const isInitialLoad = messages.length > 0 && !isLoading && parsedMessages[0] === undefined;

      if (isInitialLoad && messages.length > 1) {
        logger.info(
          '🔄 Detected imported chat with',
          messages.length,
          'messages - skipping action execution (files already restored)',
        );
        skipActionExecution = true;
        setIsImportedChat(true);
      } else if (isLoading) {
        // New message streaming, not an import - re-enable actions
        skipActionExecution = false;
        setIsImportedChat(false);
      }

      for (const [index, message] of messages.entries()) {
        if (message.role === 'assistant') {
          const text = Array.isArray((message as any).parts)
            ? (message as any).parts
                .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
                .map((p: any) => p.text)
                .join('')
            : ((message as any).content ?? '');

          const newParsedContent = messageParser.parse(message.id, text);

          setParsedMessages((prevParsed) => ({
            ...prevParsed,
            [index]: !reset ? (prevParsed[index] || '') + newParsedContent : newParsedContent,
          }));
        }
      }

      // Re-enable action execution after parsing imported messages
      if (isInitialLoad) {
        skipActionExecution = false;
      }
    },
    [parsedMessages],
  );

  return { parsedMessages, parseMessages };
}
