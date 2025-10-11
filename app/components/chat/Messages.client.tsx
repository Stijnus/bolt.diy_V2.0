import { useStore } from '@nanostores/react';
import type { UIMessage } from 'ai';
import { User } from 'lucide-react';
import React from 'react';
import { AssistantMessage } from './AssistantMessage';
import { LoadingAnimation } from './LoadingAnimation';
import { MessageActionMenu } from './MessageActionMenu';
import { UserMessage } from './UserMessage';
import { errorStore } from '~/lib/stores/errors';
import { classNames } from '~/utils/classNames';
import { WORK_DIR } from '~/utils/constants';

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: UIMessage[];
  onRevertMessage?: (index: number) => void;
}

export const Messages = React.forwardRef<HTMLDivElement, MessagesProps>((props: MessagesProps, ref) => {
  const { id, isStreaming = false, messages = [], onRevertMessage } = props;

  const errorsMap = useStore(errorStore.errors);
  const activeErrors = Object.values(errorsMap).filter((e) => !e.dismissed && e.severity === 'error');

  const toRel = (p?: string) => (p ? p.replace(WORK_DIR + '/', '').replace(/^\//, '') : '');

  return (
    <div id={id} ref={ref} className={props.className}>
      {messages.length > 0
        ? messages.map((message, index) => {
            const role = message.role;

            const content = Array.isArray((message as any).parts)
              ? (message as any).parts
                  .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
                  .map((p: any) => p.text)
                  .join('')
              : ((message as any).content ?? '');

            const isUserMessage = role === 'user';
            const isFirst = index === 0;
            const isLast = index === messages.length - 1;

            return (
              <div
                key={index}
                className={classNames('group flex gap-4 p-6 w-full rounded-[calc(0.75rem-1px)] relative', {
                  'bg-bolt-elements-messages-background': isUserMessage || !isStreaming || (isStreaming && !isLast),
                  'bg-gradient-to-b from-bolt-elements-messages-background from-30% to-transparent':
                    isStreaming && isLast,
                  'mt-4': !isFirst,
                })}
              >
                {isUserMessage && (
                  <div className="flex items-center justify-center w-[34px] h-[34px] overflow-hidden bg-white text-gray-600 rounded-full shrink-0 self-start">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="grid grid-col-1 w-full">
                  {isUserMessage ? <UserMessage content={content} /> : <AssistantMessage content={content} />}
                </div>
                {!isLast && !isStreaming && onRevertMessage && (
                  <div className="absolute top-2 right-2">
                    <MessageActionMenu messageIndex={index} onRevert={() => onRevertMessage(index)} />
                  </div>
                )}
              </div>
            );
          })
        : null}

      {/* Render active dev server errors inline in chat as collapsible assistant messages */}
      {activeErrors.slice(0, 2).map((error, idx) => {
        const summary = `Dev server error: ${error.message}${error.file ? ` — ${toRel(error.file)}${error.line ? `:${error.line}` : ''}` : ''}`;
        const openLink = error.file ? `<a href="bolt-file://${encodeURIComponent(error.file)}">Open file</a>` : '';
        const fixLink = `<a href="bolt-fix://${encodeURIComponent(error.id)}">Ask AI to fix</a>`;
        const stack = error.stack ? `\n\nStack:\n\n\`\`\`\n${error.stack}\n\`\`\`` : '';
        const md = `<details><summary>${summary}</summary>\n\n${openLink}${openLink ? ' • ' : ''}${fixLink}${stack}\n</details>`;

        return (
          <div
            key={`error-${error.id}-${idx}`}
            className={classNames(
              'flex gap-4 p-6 w-full rounded-[calc(0.75rem-1px)] mt-4',
              'bg-bolt-elements-messages-background',
            )}
          >
            <div className="grid grid-col-1 w-full">
              <div className="flex justify-end mb-1">
                <button
                  className="text-xs text-bolt-elements-textSecondary hover:underline"
                  onClick={() => errorStore.dismissError(error.id)}
                >
                  Dismiss
                </button>
              </div>
              <AssistantMessage content={md} />
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex justify-center w-full mt-6 mb-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-bolt-elements-messages-background border border-bolt-elements-borderColor/50">
            <LoadingAnimation variant="wave" />
            <span className="text-sm text-bolt-elements-textSecondary">AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
});
