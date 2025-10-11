import { useLoaderData, useNavigate } from '@remix-run/react';
import type { UIMessage } from 'ai';
import { atom } from 'nanostores';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';
import { useAuth } from '~/lib/contexts/AuthContext';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { currentModel, parseFullModelId, setChatModel, setCurrentModel } from '~/lib/stores/model';
import { workbenchStore } from '~/lib/stores/workbench';
import { createClient } from '~/lib/supabase/client';
import type { FullModelId } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { waitForFileOperations } from '~/utils/sync-helpers';
import { ActionRunner } from '~/lib/runtime/action-runner';
import { clearBoltTerminal, writeToBoltTerminal, getBoltTerminalBuffer } from '~/lib/runtime/bolt-terminal-bus';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { webcontainer } from '~/lib/webcontainer';
import { WORK_DIR } from '~/utils/constants';

const logger = createScopedLogger('ChatHistory');

export interface TerminalState {
  isVisible: boolean;
  boltBuffer?: string;
  restartCommand?: string;

  // Future: Add command history, CWD, etc.
}

export interface WorkbenchState {
  currentView: 'code' | 'preview';
  showWorkbench: boolean;
}

export interface EditorState {
  selectedFile?: string;
  scrollPositions?: Record<string, { top: number; left: number }>;
}

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: UIMessage[];
  timestamp: string;
  model?: FullModelId;
  origin?: 'local' | 'remote';
  fileState?: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  terminalState?: TerminalState;
  workbenchState?: WorkbenchState;
  editorState?: EditorState;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

let dbPromise: Promise<IDBDatabase | undefined> | undefined;

async function getDatabase() {
  if (!persistenceEnabled) {
    return undefined;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  if (!dbPromise) {
    dbPromise = openDatabase();
  }

  return dbPromise;
}

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const { user } = useAuth();

  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();
  const dbRef = useRef<IDBDatabase | undefined>(undefined);

  useEffect(() => {
    if (!persistenceEnabled) {
      setReady(true);

      return () => {
        void 0;
      };
    }

    if (typeof window === 'undefined') {
      return () => {
        void 0;
      };
    }

    let cancelled = false;

    const loadHistory = async () => {
      const database = await getDatabase();

      if (cancelled) {
        return;
      }

      if (!database) {
        setReady(true);

        if (persistenceEnabled) {
          toast.error(`Chat persistence is unavailable`);
        }

        return;
      }

      dbRef.current = database;

      if (mixedId) {
        try {
          let storedMessages = await getMessages(database, mixedId);

          if ((!storedMessages || storedMessages.messages.length === 0) && user) {
            const supabase = createClient();

            if (!supabase) {
              logger.warn('Supabase client unavailable while attempting to load remote chat history');
              toast.error('Cloud sync is disabled. Configure Supabase to load saved chats.');
            } else {
              try {
                const { data, error } = await supabase
                  .from('chats')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('url_id', mixedId)
                  .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                  throw error;
                }

                const remoteMessages = ((data as any)?.messages ?? []) as UIMessage[];

                if (data && remoteMessages.length > 0) {
                  const remoteDescription = (data as { description?: string | null }).description ?? undefined;
                  const remoteModel = (data as { model?: FullModelId | null }).model ?? undefined;

                  const remoteTimestamp =
                    (data as { updated_at?: string | null }).updated_at ?? new Date().toISOString();

                  const remoteUrlId = (data as { url_id: string }).url_id;

                  const remoteFileState =
                    (data as { file_state?: Record<string, { content: string; isBinary: boolean }> | null })
                      .file_state ?? undefined;

                  const remoteTerminalState =
                    (
                      data as {
                        terminal_state?: { isVisible: boolean; boltBuffer?: string; restartCommand?: string } | null;
                      }
                    ).terminal_state ?? undefined;

                  const remoteWorkbenchState =
                    (data as { workbench_state?: { currentView: 'code' | 'preview'; showWorkbench: boolean } | null })
                      .workbench_state ?? undefined;

                  const remoteEditorState =
                    (
                      data as {
                        editor_state?: {
                          selectedFile?: string;
                          scrollPositions?: Record<string, { top: number; left: number }>;
                        } | null;
                      }
                    ).editor_state ?? undefined;

                  await setMessages(
                    database,
                    remoteUrlId,
                    remoteMessages,
                    remoteUrlId,
                    remoteDescription,
                    remoteModel,
                    remoteTimestamp,
                    'remote',
                    remoteFileState,
                    remoteTerminalState,
                    remoteWorkbenchState,
                    remoteEditorState,
                  );

                  storedMessages = await getMessages(database, mixedId);
                }
              } catch (supabaseError) {
                logger.error('Failed to load chat history from Supabase:', supabaseError);
                toast.error('Unable to load cloud chat history. Please try again.');
              }
            }
          }

          if (storedMessages && storedMessages.messages.length > 0) {
            setInitialMessages(storedMessages.messages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);

            // Restore file state if available
            if (storedMessages.fileState && Object.keys(storedMessages.fileState).length > 0) {
              const totalFiles = Object.keys(storedMessages.fileState).length;
              logger.info(`Found ${totalFiles} files in chat history, starting restoration...`);

              // Show loading toast for file restoration
              const restorationToast = toast.loading(`Restoring ${totalFiles} project files...`, {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
              });

              try {
                // Import decoding utilities
                const { decodeFileContent } = await import('~/utils/file-encoding');

                const fileMap: Record<string, { type: 'file'; content: string; isBinary: boolean }> = {};

                // Validate and clean file state before restoration
                Object.entries(storedMessages.fileState).forEach(([path, fileData]) => {
                  // Validate file data structure
                  if (
                    path &&
                    typeof path === 'string' &&
                    fileData &&
                    typeof fileData === 'object' &&
                    'content' in fileData &&
                    typeof fileData.content === 'string'
                  ) {
                    // Decode binary files from base64
                    const encoding = fileData.encoding || 'plain';
                    const decodedContent = decodeFileContent(fileData.content, encoding);

                    fileMap[path] = {
                      type: 'file',
                      content: decodedContent,
                      isBinary: fileData.isBinary || false,
                    };
                  } else {
                    logger.warn(`Skipping invalid file data for path: ${path}`);
                  }
                });

                // Capture files before restoration to compute created/changed after
                const filesBefore = { ...workbenchStore.files.get() };

                const validFileCount = Object.keys(fileMap).length;

                if (validFileCount > 0) {
                  logger.info(`Attempting to restore ${validFileCount} valid files to WebContainer...`);

                  try {
                    // Ensure workbench is visible before restoring files
                    workbenchStore.setShowWorkbench(true);

                    // Import WebContainer readiness check
                    const { waitForWebContainer } = await import('~/lib/webcontainer/utils');

                    // Wait for WebContainer to be ready before attempting file restoration
                    toast.update(restorationToast, {
                      render: `Initializing WebContainer...`,
                      isLoading: true,
                    });

                    let postRestoreMessagePushed = false;
                    let postRestoreMd: string | null = null;

                    const wcResult = await waitForWebContainer({ timeout: 30000, throwOnTimeout: false });

                    if (!wcResult.ready || !wcResult.container) {
                      throw new Error(wcResult.error?.message || 'WebContainer failed to initialize within 30 seconds');
                    }

                    logger.info(`WebContainer ready after ${wcResult.timeWaited}ms, proceeding with file restoration`);

                    toast.update(restorationToast, {
                      render: `Restoring ${validFileCount} files...`,
                      isLoading: true,
                    });

                    await workbenchStore.restoreFiles(fileMap);

                    // Success! Update the toast
                    toast.update(restorationToast, {
                      render: `✅ Successfully restored ${validFileCount} files`,
                      type: 'success',
                      isLoading: false,
                      autoClose: 3000,

                      closeOnClick: true,
                      draggable: true,
                    });

                    try {
                      // Ensure file store is refreshed before diffing
                      await waitForFileOperations(workbenchStore, { timeout: 2000 });

                      const filesAfter = { ...workbenchStore.files.get() } as Record<string, any>;
                      const restoredPaths = Object.keys(fileMap).filter((p) => fileMap[p]?.type === 'file');

                      const toRel = (p: string) => p.replace(WORK_DIR + '/', '').replace(/^\//, '');

                      const created: string[] = [];
                      const changed: string[] = [];

                      for (const absPath of restoredPaths) {
                        const before = filesBefore[absPath];
                        const after = filesAfter[absPath];

                        if (!before && after) {
                          created.push(absPath);
                        } else if (before && after && before.type === 'file' && after.type === 'file') {
                          if (before.content !== after.content) {
                            changed.push(absPath);
                          }
                        }
                      }

                      // Show a clickable toast with created/changed files
                      if (created.length > 0 || changed.length > 0) {
                        const makeItem = (path: string) =>
                          React.createElement(
                            'li',
                            { key: path, className: 'py-0.5' },
                            React.createElement(
                              'button',
                              {
                                className:
                                  'text-bolt-elements-textAccent hover:underline text-sm text-left truncate max-w-[36rem]',
                                onClick: () => {
                                  workbenchStore.setShowWorkbench(true);
                                  workbenchStore.setSelectedFile(path);
                                },
                                title: toRel(path),
                              },
                              toRel(path),
                            ),
                          );

                        const content = React.createElement(
                          'div',
                          { className: 'text-sm' },
                          React.createElement(
                            'div',
                            { className: 'font-medium mb-1' },
                            `Imported project: ${validFileCount} files restored`,
                          ),
                          created.length > 0
                            ? React.createElement(
                                'div',
                                { className: 'mb-1' },
                                React.createElement('div', { className: 'font-medium' }, 'Created'),
                                React.createElement(
                                  'ul',
                                  { className: 'list-disc pl-5 mt-0.5' },
                                  ...created.slice(0, 8).map(makeItem),
                                ),
                                created.length > 8
                                  ? React.createElement(
                                      'div',
                                      { className: 'text-xs text-bolt-elements-textSecondary mt-1' },
                                      `+${created.length - 8} more`,
                                    )
                                  : null,
                              )
                            : null,
                          changed.length > 0
                            ? React.createElement(
                                'div',
                                null,
                                React.createElement('div', { className: 'font-medium' }, 'Changed'),
                                React.createElement(
                                  'ul',
                                  { className: 'list-disc pl-5 mt-0.5' },
                                  ...changed.slice(0, 8).map(makeItem),
                                ),
                                changed.length > 8
                                  ? React.createElement(
                                      'div',
                                      { className: 'text-xs text-bolt-elements-textSecondary mt-1' },
                                      `+${changed.length - 8} more`,
                                    )
                                  : null,
                              )
                            : null,
                        );

                        toast.info(content, { autoClose: 8000, closeOnClick: false });
                        // Also add a chat assistant message with clickable links
                        try {
                          const toRel = (p: string) => p.replace(WORK_DIR + '/', '').replace(/^\//, '');
                          // Important: Markdown inside HTML blocks (like <details>) is not parsed by CommonMark.
                          // So we render real <a> anchors instead of [text](url) markdown inside the details.
                          const makeLink = (p: string) =>
                            `- <a href="bolt-file://${encodeURIComponent(p)}">${toRel(p)}</a>`;
                          const summary = `Imported project: ${validFileCount} files restored — Created: ${created.length}, Changed: ${changed.length}`;
                          let md = `<details><summary>${summary}</summary>`;
                          md += `\n\nClick a file to open it in the editor.`;
                          if (created.length > 0) {
                            md += `\n\nCreated:\n${created.slice(0, 20).map(makeLink).join('\n')}`;
                            if (created.length > 20) md += `\n... +${created.length - 20} more`;
                          }
                          if (changed.length > 0) {
                            md += `\n\nChanged:\n${changed.slice(0, 20).map(makeLink).join('\n')}`;
                            if (changed.length > 20) md += `\n... +${changed.length - 20} more`;
                          }
                          md += `\n</details>`;
                          postRestoreMd = md;

                          const assistantMsg: UIMessage = {
                            role: 'assistant',
                            parts: [{ type: 'text', text: md }],
                          } as any;
                          if ((storedMessages?.messages?.length ?? 0) > 0) {
                            setInitialMessages([...storedMessages!.messages, assistantMsg]);
                          } else {
                            // no prior messages; add later together with intro below
                            postRestoreMessagePushed = true;
                            setInitialMessages([assistantMsg]);
                          }
                        } catch (e) {
                          logger.warn('Failed to append assistant file list message', e);
                        }
                      }

                      // Auto-install and start dev server if package.json is present
                      const hasPkg = restoredPaths.some(
                        (p) => p.endsWith('/package.json') || p === '/package.json' || p === 'package.json',
                      );

                      if (hasPkg) {
                        if (workbenchStore.getDevServerRunning()) {
                          // Avoid multiple dev servers
                          toast.info('Dev server already running. Skipping auto-start.');
                        } else {
                          workbenchStore.setShowWorkbench(true);
                          workbenchStore.toggleTerminal(true);
                          clearBoltTerminal();
                          writeToBoltTerminal('\n\x1b[1m=== Import started: installing dependencies ===\x1b[0m\n');

                          const runner = new ActionRunner(webcontainer);
                          const baseId = `import_${Date.now()}`;

                          const installId = `${baseId}_install`;
                          const installAction: ActionCallbackData = {
                            messageId: baseId,
                            artifactId: baseId,
                            actionId: installId,
                            action: { type: 'shell', content: 'npm install' },
                          };

                          const devId = `${baseId}_dev`;
                          const devAction: ActionCallbackData = {
                            messageId: baseId,
                            artifactId: baseId,
                            actionId: devId,
                            action: { type: 'shell', content: 'npm run dev' },
                          };

                          // Announce install and dev steps in chat instead of toasts
                          setInitialMessages((prev) => [
                            ...prev,
                            {
                              role: 'assistant',
                              parts: [{ type: 'text', text: 'Installing dependencies... See Bolt Terminal for logs.' }],
                            } as any,
                          ]);

                          runner.addAction(installAction);
                          await runner.runAction(installAction);

                          runner.onActionComplete(installId, () => {
                            setInitialMessages((prev) => [
                              ...prev,
                              {
                                role: 'assistant',
                                parts: [{ type: 'text', text: 'Starting dev server (monitoring in Bolt Terminal)...' }],
                              } as any,
                            ]);
                            runner.addAction(devAction);
                            runner.runAction(devAction);
                            workbenchStore.setDevServerRunning(true);
                          });
                        }
                      }
                    } catch (e) {
                      logger.warn('Post-restore steps failed (diff/auto-run)', e);
                    }

                    logger.info(`Successfully restored ${validFileCount} files to WebContainer`);

                    // If this chat has no prior messages but we restored files,
                    // seed a synthetic user message so the chat appears started
                    // and the intro suggestions are hidden.
                    if ((storedMessages?.messages?.length ?? 0) === 0) {
                      const intro: UIMessage = {
                        role: 'user',
                        parts: [{ type: 'text', text: `Imported project with ${validFileCount} files.` }],
                      } as any;

                      if (postRestoreMessagePushed && postRestoreMd) {
                        const assistantMsg: UIMessage = {
                          role: 'assistant',
                          parts: [{ type: 'text', text: postRestoreMd }],
                        } as any;
                        setInitialMessages([intro, assistantMsg]);
                      } else {
                        setInitialMessages([intro]);
                      }
                    }
                  } catch (error) {
                    logger.error('Failed to restore files to WebContainer:', error);

                    // Try partial restoration or fallback
                    try {
                      // Still set the files in the store as a fallback
                      workbenchStore.files.set(fileMap);
                      workbenchStore.setShowWorkbench(true);

                      toast.update(restorationToast, {
                        render: `⚠️ Restored ${validFileCount} files to editor only (WebContainer unavailable)`,
                        type: 'warning',
                        isLoading: false,
                        autoClose: 5000,
                        closeOnClick: true,
                        draggable: true,
                      });

                      logger.info(`Fallback: Set ${validFileCount} files in store`);
                    } catch (fallbackError) {
                      logger.error('Failed to restore files even with fallback:', fallbackError);

                      toast.update(restorationToast, {
                        render: `❌ Failed to restore project files. You may need to recreate them.`,
                        type: 'error',
                        isLoading: false,
                        autoClose: false,
                        closeOnClick: true,
                        draggable: true,
                      });
                    }
                  }
                } else {
                  logger.warn('No valid file data found in chat history');

                  toast.update(restorationToast, {
                    render: 'ℹ️ No files found to restore from this chat',
                    type: 'info',
                    isLoading: false,
                    autoClose: 3000,
                    closeOnClick: true,
                    draggable: true,
                  });
                }
              } catch (error) {
                logger.error('Unexpected error during file restoration:', error);

                toast.update(restorationToast, {
                  render: `❌ Unexpected error during file restoration`,
                  type: 'error',
                  isLoading: false,
                  autoClose: false,
                  closeOnClick: true,
                  draggable: true,
                });
              }
            }

            // Restore terminal state if available
            if (storedMessages.terminalState) {
              logger.info('Restoring terminal state...');

              try {
                // Restore terminal visibility
                if (storedMessages.terminalState.isVisible) {
                  workbenchStore.toggleTerminal(true);
                  logger.info('Terminal visibility restored');
                }
                // Restore Bolt Terminal buffer
                if (storedMessages.terminalState.boltBuffer) {
                  writeToBoltTerminal(storedMessages.terminalState.boltBuffer);
                }
                // Restore restart command preference
                if (storedMessages.terminalState.restartCommand) {
                  workbenchStore.setRestartCommand(storedMessages.terminalState.restartCommand);
                }
              } catch (error) {
                logger.error('Failed to restore terminal state:', error);

                // Non-critical, continue
              }
            }

            // Restore workbench state if available
            if (storedMessages.workbenchState) {
              logger.info('Restoring workbench state...');

              try {
                // Restore workbench visibility
                if (storedMessages.workbenchState.showWorkbench) {
                  workbenchStore.setShowWorkbench(true);
                }

                // Restore view mode (code vs preview)
                workbenchStore.currentView.set(storedMessages.workbenchState.currentView);

                logger.info(
                  `Workbench state restored: view=${storedMessages.workbenchState.currentView}, visible=${storedMessages.workbenchState.showWorkbench}`,
                );
              } catch (error) {
                logger.error('Failed to restore workbench state:', error);

                // Non-critical, continue
              }
            }

            // Restore editor state if available
            if (storedMessages.editorState) {
              logger.info('Restoring editor state...');

              try {
                // Restore selected file
                if (storedMessages.editorState.selectedFile) {
                  // Wait a moment for files to be loaded before selecting
                  setTimeout(() => {
                    workbenchStore.setSelectedFile(storedMessages.editorState!.selectedFile);
                    logger.info(`Selected file restored: ${storedMessages.editorState!.selectedFile}`);
                  }, 500);
                }

                /*
                 * Note: Scroll positions are stored but restoration requires deeper integration
                 * with the editor store. This could be added in a future enhancement.
                 */
              } catch (error) {
                logger.error('Failed to restore editor state:', error);

                // Non-critical, continue
              }
            }

            if (storedMessages.model) {
              const { provider, modelId } = parseFullModelId(storedMessages.model);

              if (provider && modelId) {
                setChatModel(storedMessages.id, provider, modelId);
                setCurrentModel(provider, modelId);
              }
            }
          } else {
            navigate(`/`, { replace: true });
          }
        } catch (error) {
          toast.error((error as Error).message);
        }
      }

      setReady(true);
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [mixedId, navigate, user]);

  const storeMessageHistoryRef = useRef<
    ((messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>) | undefined
  >(undefined);

  storeMessageHistoryRef.current = async (messages: UIMessage[], modelFullId?: FullModelId) => {
    if (messages.length === 0) {
      return;
    }

    if (!persistenceEnabled || typeof window === 'undefined') {
      return;
    }

    let database = dbRef.current;

    if (!database) {
      database = await getDatabase();

      if (!database) {
        return;
      }

      dbRef.current = database;
    }

    const { firstArtifact } = workbenchStore;

    // Fix: Use a separate variable name to avoid shadowing the state variable
    let currentUrlId = urlId;

    if (!currentUrlId && firstArtifact?.id) {
      const generatedUrlId = await getUrlId(database, firstArtifact.id);

      navigateChat(generatedUrlId);
      setUrlId(generatedUrlId);
      currentUrlId = generatedUrlId; // Use local variable immediately
    }

    if (!description.get() && firstArtifact?.title) {
      description.set(firstArtifact?.title);
    }

    let currentChatId = chatId.get();

    if (initialMessages.length === 0 && !currentChatId) {
      const nextId = await getNextId(database);

      chatId.set(nextId);
      currentChatId = nextId; // Use local variable immediately

      const currentSelection = currentModel.get();
      setChatModel(nextId, currentSelection.provider, currentSelection.modelId);

      if (!currentUrlId) {
        navigateChat(nextId);
        currentUrlId = nextId; // Use local variable immediately
      }
    }

    const selection = modelFullId ?? currentModel.get().fullId;

    /*
     * Wait for any ongoing file operations to complete before capturing state
     * This ensures WebContainer file writes are done and the store has refreshed
     * Increased timeout to account for:
     * - Action parsing and queueing (0-200ms)
     * - Action execution in WebContainer (200-2000ms)
     * - File watcher debounce (100ms)
     * - FilesStore refresh from WebContainer (100-500ms)
     * Total: ~3000ms worst case
     */
    try {
      logger.debug('Waiting for file operations to complete before capturing state...');
      await waitForFileOperations(workbenchStore, { timeout: 5000, stabilityDelay: 300 });
      logger.debug('File operations complete, capturing state now');
    } catch (error) {
      logger.warn('File operations wait timed out, capturing state anyway:', error);
    }

    // Capture terminal state
    const terminalState: TerminalState = {
      isVisible: workbenchStore.showTerminal.get(),
      boltBuffer: getBoltTerminalBuffer(),
      restartCommand: workbenchStore.getRestartCommand(),
    };

    // Capture workbench state (view mode and visibility)
    const workbenchState: WorkbenchState = {
      currentView: workbenchStore.currentView.get(),
      showWorkbench: workbenchStore.showWorkbench.get(),
    };

    // Capture editor state (selected file)
    const editorState: EditorState = {
      selectedFile: workbenchStore.selectedFile.get(),

      /*
       * Note: Scroll positions are tracked per file in editor documents
       * but are not easily accessible from here. Could be added in the future.
       */
    };

    // Get current file state from workbench store
    const currentFiles = workbenchStore.files.get();

    let fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }> | undefined;

    if (currentFiles) {
      // Import encoding utilities
      const { encodeFileContent } = await import('~/utils/file-encoding');

      fileState = Object.fromEntries(
        Object.entries(currentFiles)
          .map(([path, file]) => {
            if (file && file.type === 'file' && file.content !== undefined) {
              const isBinary = file.isBinary || false;

              // Encode binary files as base64 for storage
              const { content: encodedContent, encoding } = encodeFileContent(file.content, isBinary);

              return [
                path,
                {
                  content: encodedContent,
                  isBinary,
                  encoding,
                },
              ];
            }

            return undefined;
          })
          .filter(
            (entry): entry is [string, { content: string; isBinary: boolean; encoding: 'plain' | 'base64' }] =>
              entry !== undefined,
          ),
      );

      // Apply the same filtering logic as FilesStore to exclude unwanted files
      if (fileState) {
        const hiddenPatterns = [
          /\/node_modules\//,
          /\/\.next/,
          /\/\.astro/,
          /\/\.git/,
          /\/\.vscode/,
          /\/\.idea/,
          /\/dist/,
          /\/build/,
          /\/\.cache/,
          /\/coverage/,
          /\/\.nyc_output/,
          /\/\.env/,
          /\/\.env\./,
          /\/\.DS_Store/,
          /\/Thumbs\.db/,
        ];

        const filteredEntries = Object.entries(fileState).filter(
          ([path]) => !hiddenPatterns.some((pattern) => pattern.test(path)),
        );

        if (filteredEntries.length !== Object.keys(fileState).length) {
          const excludedCount = Object.keys(fileState).length - filteredEntries.length;
          logger.info(`Excluding ${excludedCount} files from chat history (node_modules, build artifacts, etc.)`);
          fileState = Object.fromEntries(filteredEntries);
        }
      }
    }

    // Save to IndexedDB (for offline support and fallback)
    await setMessages(
      database,
      currentChatId as string,
      messages,
      currentUrlId,
      description.get(),
      selection,
      undefined,
      'local',
      fileState,
      terminalState,
      workbenchState,
      editorState,
    );

    // Also save to Supabase if user is logged in
    if (user) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();
        const finalUrlId = currentUrlId || currentChatId;

        // Use upsert to insert or update the chat
        const { error } = await supabase.from('chats').upsert(
          {
            url_id: finalUrlId,
            user_id: user.id,
            messages: messages as any,
            description: description.get() || null,
            model: selection,
            file_state: fileState,
            terminal_state: terminalState,
            workbench_state: workbenchState,
            editor_state: editorState,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'url_id,user_id',
          },
        );

        if (error) {
          logger.error('Failed to sync chat to Supabase:', error);
          setConnectionError(`Sync failed: ${error.message}`);

          // Don't throw - we still have IndexedDB backup
        } else {
          logger.info(`Chat ${finalUrlId} synced to Supabase`);
        }
      } catch (error) {
        logger.error('Error syncing to Supabase:', error);
        setConnectionError(`Sync error: ${(error as Error).message}`);

        // Don't throw - we still have IndexedDB backup
      } finally {
        setSyncing(false);
      }
    }
  };

  return {
    ready: !mixedId || ready,
    initialMessages,
    storeMessageHistory: (...args: Parameters<NonNullable<typeof storeMessageHistoryRef.current>>) =>
      storeMessageHistoryRef.current?.(...args) ?? Promise.resolve(),
  };
}

function navigateChat(nextId: string) {
  /**
   * FIXME: Using the intended navigate function causes a rerender for <Chat /> that breaks the app.
   *
   * `navigate(`/chat/${nextId}`, { replace: true });`
   */
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}
