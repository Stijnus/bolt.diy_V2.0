import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, MessageSquare, FileCode, ExternalLink } from 'lucide-react';
import { memo, useState } from 'react';
import { useErrorChat } from '~/lib/hooks/useErrorChat';
import { chatStore } from '~/lib/stores/chat';
import { errorStore } from '~/lib/stores/errors';
import { workbenchStore } from '~/lib/stores/workbench';
import type { DevServerError } from '~/types/errors';
import { classNames } from '~/utils/classNames';

export const ErrorNotification = memo(() => {
  const errors = useStore(errorStore.errors);
  const activeErrors = Object.values(errors).filter((error) => !error.dismissed && error.severity === 'error');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  if (activeErrors.length === 0) {
    return null;
  }

  const toggleExpanded = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);

    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }

    setExpandedErrors(newExpanded);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full space-y-2">
      <AnimatePresence>
        {activeErrors.slice(0, 3).map((error) => (
          <ErrorCard
            key={error.id}
            error={error}
            isExpanded={expandedErrors.has(error.id)}
            onToggleExpand={() => toggleExpanded(error.id)}
            onDismiss={() => errorStore.dismissError(error.id)}
          />
        ))}
      </AnimatePresence>

      {activeErrors.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg px-4 py-2 text-sm text-bolt-elements-textSecondary text-center"
        >
          +{activeErrors.length - 3} more errors
          <button
            onClick={() => errorStore.dismissAllErrors()}
            className="ml-2 text-bolt-elements-textPrimary hover:underline"
          >
            Dismiss all
          </button>
        </motion.div>
      )}
    </div>
  );
});

interface ErrorCardProps {
  error: DevServerError;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDismiss: () => void;
}

const ErrorCard = memo(({ error, isExpanded, onToggleExpand, onDismiss }: ErrorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { sendErrorToChat } = useErrorChat();
  const files = useStore(workbenchStore.files);

  const openInEditor = () => {
    if (error.file) {
      workbenchStore.showWorkbench.set(true);
      workbenchStore.setSelectedFile(error.file);
    }
  };

  const solveWithAI = () => {
    // Get file content if available
    const file = error.file ? files[error.file] : undefined;
    const fileContent = file?.type === 'file' ? file.content : undefined;

    // Send error to chat
    const errorMessage = sendErrorToChat(error, fileContent, () => {
      // Dismiss the error after sending to chat
      onDismiss();
    });

    if (errorMessage) {
      // Set the chat input with the error message
      chatStore.setKey('pendingInput', errorMessage);
      chatStore.setKey('showChat', true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={classNames(
        'bg-bolt-elements-background-depth-2 border-2 border-red-500/50 rounded-lg shadow-lg overflow-hidden',
        {
          'ring-2 ring-red-500/30': isHovered,
        },
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-medium text-bolt-elements-textPrimary">{getErrorTitle(error)}</h3>
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-bolt-elements-background-depth-1 rounded transition-colors"
                title="Dismiss error"
              >
                <X className="w-4 h-4 text-bolt-elements-textSecondary" />
              </button>
            </div>

            <p className="text-sm text-bolt-elements-textSecondary mb-2 line-clamp-2">{error.message}</p>

            {error.file && (
              <button
                onClick={openInEditor}
                className="flex items-center gap-1.5 text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors mb-3"
              >
                <FileCode className="w-3 h-3" />
                <span className="font-mono truncate">{error.file}</span>
                {error.line && <span>:{error.line}</span>}
                {error.column && <span>:{error.column}</span>}
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={solveWithAI}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                Ask AI to fix
              </button>

              {error.stack && (
                <button
                  onClick={onToggleExpand}
                  className="px-3 py-1.5 text-xs font-medium bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-md transition-colors"
                >
                  {isExpanded ? 'Hide' : 'Show'} stack trace
                </button>
              )}

              <span className="ml-auto text-xs text-bolt-elements-textTertiary">
                {getErrorSourceBadge(error.source)}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && error.stack && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-bolt-elements-borderColor"
            >
              <pre className="text-xs text-bolt-elements-textSecondary font-mono overflow-x-auto p-2 bg-bolt-elements-background-depth-1 rounded max-h-40 overflow-y-auto">
                {error.stack}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

function getErrorTitle(error: DevServerError): string {
  const titles: Record<DevServerError['type'] | 'default', string> = {
    syntax: 'Syntax Error',
    runtime: 'Runtime Error',
    build: 'Build Error',
    warning: 'Warning',
    unknown: 'Error',
    default: 'Error',
  };
  return titles[error.type] ?? titles.default;
}

function getErrorSourceBadge(source: DevServerError['source']): string {
  const badges: Record<DevServerError['source'], string> = {
    vite: 'Vite',
    webpack: 'Webpack',
    next: 'Next.js',
    react: 'React',
    typescript: 'TypeScript',
    eslint: 'ESLint',
    unknown: 'Dev Server',
  };

  return badges[source] || source;
}
