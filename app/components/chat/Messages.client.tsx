import type { UIMessage } from 'ai';
import { User } from 'lucide-react';
import React from 'react';
import { AssistantMessage } from './AssistantMessage';
import { LoadingAnimation } from './LoadingAnimation';
import { UserMessage } from './UserMessage';
import { classNames } from '~/utils/classNames';

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: UIMessage[];
}

export const Messages = React.forwardRef<HTMLDivElement, MessagesProps>((props: MessagesProps, ref) => {
  const { id, isStreaming = false, messages = [] } = props;

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
                className={classNames('flex gap-4 p-6 w-full rounded-[calc(0.75rem-1px)]', {
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
              </div>
            );
          })
        : null}
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
