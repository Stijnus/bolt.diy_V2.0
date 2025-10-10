import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Circle, Check, X, FileCode, Terminal as TerminalIcon } from 'lucide-react';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import { LoadingAnimation } from './LoadingAnimation';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
}

export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      return Object.values(actions);
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }
  }, [actions]);

  return (
    <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={() => {
            const showWorkbench = workbenchStore.showWorkbench.get();
            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">{artifact?.title}</div>
            <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">Click to open Workbench</div>
          </div>
        </button>
        <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
        <AnimatePresence>
          {actions.length && (
            <motion.button
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.15, ease: cubicEasingFn }}
              className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
              onClick={toggleActions}
            >
              <div className="p-4">
                {showActions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showActions && actions.length > 0 && (
          <motion.div
            className="actions"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />
            <div className="p-5 text-left bg-bolt-elements-actions-background">
              <ActionList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div
                className={classNames('flex items-start gap-3 p-3 rounded-lg transition-all duration-200', {
                  'bg-bolt-elements-actions-background': status === 'pending',
                  'bg-blue-500/10 border border-blue-500/20': status === 'running',
                  'bg-green-500/10 border border-green-500/20': status === 'complete',
                  'bg-red-500/10 border border-red-500/20': status === 'failed' || status === 'aborted',
                })}
              >
                <div className={classNames('flex-shrink-0 mt-0.5', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <div className="relative">
                      <LoadingAnimation variant="dots" className="scale-75" />
                    </div>
                  ) : status === 'pending' ? (
                    <Circle className="w-5 h-5 opacity-40" />
                  ) : status === 'complete' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    {type === 'file' ? (
                      <>
                        <FileCode className="w-4 h-4 flex-shrink-0 text-bolt-elements-textSecondary" />
                        <span className="text-bolt-elements-textPrimary">
                          {status === 'pending' ? 'Will create' : status === 'running' ? 'Creating' : 'Created'}{' '}
                        </span>
                        <button
                          onClick={() => {
                            // Open the workbench and select the file
                            workbenchStore.showWorkbench.set(true);
                            workbenchStore.setSelectedFile(action.filePath);
                          }}
                          className="group/filepath bg-bolt-elements-artifacts-inlineCode-background hover:bg-bolt-elements-artifacts-inlineCode-background/80 text-bolt-elements-artifacts-inlineCode-text px-1.5 py-0.5 rounded text-xs font-mono truncate transition-all hover:ring-2 hover:ring-bolt-elements-borderColorActive cursor-pointer"
                          title={`Click to open ${action.filePath} in editor`}
                        >
                          <span className="group-hover/filepath:underline">{action.filePath}</span>
                        </button>
                      </>
                    ) : type === 'shell' ? (
                      <>
                        <TerminalIcon className="w-4 h-4 flex-shrink-0 text-bolt-elements-textSecondary" />
                        <span className="text-bolt-elements-textPrimary">
                          {status === 'pending' ? 'Will run' : status === 'running' ? 'Running' : 'Ran'} command
                        </span>
                      </>
                    ) : null}
                  </div>

                  {type === 'shell' && (
                    <ShellCodeBlock
                      classsName={classNames('mt-2', {
                        'mb-0': isLast,
                      })}
                      code={content}
                    />
                  )}

                  {status === 'running' && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs text-bolt-elements-textSecondary flex items-center gap-1.5"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      In progress...
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
