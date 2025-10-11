import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { BundledLanguage } from 'shiki';
import { Artifact } from './Artifact';
import { CodeBlock } from './CodeBlock';

import styles from './Markdown.module.scss';
import { chatStore } from '~/lib/stores/chat';
import { errorStore } from '~/lib/stores/errors';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';
import { rehypePlugins, remarkPlugins, allowedHTMLElements } from '~/utils/markdown';

const logger = createScopedLogger('MarkdownComponent');

interface MarkdownProps {
  children: string;
  html?: boolean;
  limitedMarkdown?: boolean;
}

export const Markdown = memo(({ children, html = false, limitedMarkdown = false }: MarkdownProps) => {
  logger.trace('Render');

  const components = useMemo(() => {
    return {
      a: ({ href, children, node, ...props }) => {
        const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          if (!href) {
            return;
          }

          // Open file in workbench editor
          if (href.startsWith('bolt-file://')) {
            e.preventDefault();

            try {
              const rawPath = decodeURIComponent(href.replace('bolt-file://', ''));
              workbenchStore.setShowWorkbench(true);
              workbenchStore.setSelectedFile(rawPath);
            } catch (err) {
              console.error('Failed to open file from link', href, err);
            }

            return;
          }

          // Prepare an error-fix prompt in chat input
          if (href.startsWith('bolt-fix://')) {
            e.preventDefault();

            try {
              const id = decodeURIComponent(href.replace('bolt-fix://', ''));
              const error = errorStore.errors.get()[id];

              let prompt = 'I encountered this development server error. Please help me fix it.';

              if (error) {
                const parts: string[] = [
                  '🔴 Error Detected',
                  '',
                  `Type: ${error.type} (${error.severity})`,
                  `Source: ${error.source}`,
                  '',
                  'Message:',
                  '```',
                  error.message,
                  '```',
                ];

                if (error.file) {
                  parts.push('', `File: \`${error.file}\``);

                  if (error.line) {
                    parts.push(`Line: ${error.line}`);
                  }

                  if (error.column) {
                    parts.push(`Column: ${error.column}`);
                  }

                  const fileEntry = workbenchStore.files.get()[error.file];

                  if (fileEntry && fileEntry.type === 'file') {
                    const lines = fileEntry.content.split('\n');

                    if (error.line) {
                      const start = Math.max(0, error.line - 6);
                      const end = Math.min(lines.length, error.line + 5);
                      const ctx = lines.slice(start, end);
                      parts.push('', 'File Context:', '```');
                      ctx.forEach((line, idx) => {
                        const lineNum = start + idx + 1;
                        const marker = lineNum === error.line ? '→' : ' ';
                        parts.push(`${marker} ${lineNum.toString().padStart(4)} | ${line}`);
                      });
                      parts.push('```');
                    } else {
                      parts.push('', 'File Content:', '```', fileEntry.content, '```');
                    }
                  }
                }

                if (error.stack) {
                  parts.push('', 'Stack Trace:', '```', error.stack, '```');
                }

                parts.push('', '---', '', 'Can you help me fix this error?');
                prompt = parts.join('\n');
              }

              chatStore.setKey('pendingInput', prompt);
              chatStore.setKey('autoSendPending', true);
              chatStore.setKey('showChat', true);
            } catch (err) {
              console.error('Failed to prepare fix prompt from link', href, err);
            }

            return;
          }
        };

        // Avoid leaking non-DOM props like `node` onto the anchor element
        const { node: _ignored, ...cleanProps } = props as any;

        return (
          <a href={href} onClick={onClick} {...cleanProps}>
            {children}
          </a>
        );
      },
      div: ({ className, children, node, ...props }) => {
        if (className?.includes('__boltArtifact__')) {
          const messageId = node?.properties.dataMessageId as string;

          if (!messageId) {
            logger.error(`Invalid message id ${messageId}`);
          }

          return <Artifact messageId={messageId} />;
        }

        return (
          <div className={className} {...props}>
            {children}
          </div>
        );
      },
      pre: (props) => {
        const { children, node, ...rest } = props;

        const [firstChild] = node?.children ?? [];

        if (
          firstChild &&
          firstChild.type === 'element' &&
          firstChild.tagName === 'code' &&
          firstChild.children[0].type === 'text'
        ) {
          const { className, ...rest } = firstChild.properties;
          const [, language = 'plaintext'] = /language-(\w+)/.exec(String(className) || '') ?? [];

          return <CodeBlock code={firstChild.children[0].value} language={language as BundledLanguage} {...rest} />;
        }

        return <pre {...rest}>{children}</pre>;
      },
    } satisfies Components;
  }, []);

  return (
    <div className={styles.MarkdownContent}>
      <ReactMarkdown
        allowedElements={allowedHTMLElements}
        components={components}
        remarkPlugins={remarkPlugins(limitedMarkdown)}
        rehypePlugins={rehypePlugins(html)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
