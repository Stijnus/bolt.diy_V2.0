import { useLoaderData, useNavigate } from '@remix-run/react';
import type { UIMessage } from 'ai';
import { atom } from 'nanostores';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';
import { useAuth } from '~/lib/contexts/AuthContext';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { currentModel, parseFullModelId, setChatModel, setCurrentModel } from '~/lib/stores/model';
import { workbenchStore } from '~/lib/stores/workbench';
import { createClient } from '~/lib/supabase/client';
import type { FullModelId } from '~/types/model';
import {
  shouldExcludeFile,
  getStringByteSize,
  wouldExceedSizeLimit,
  FILE_SIZE_LIMITS,
  formatBytes,
} from '~/utils/constants/file-patterns';
import { handleErrorWithAction, ERROR_TEMPLATES } from '~/utils/error-messages';
import { createScopedLogger } from '~/utils/logger';
import { waitForFileOperations } from '~/utils/sync-helpers';

const logger = createScopedLogger('ChatHistory');

export interface TerminalState {
  isVisible: boolean;
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

                  const remoteTerminalState = (data as { terminal_state?: { isVisible: boolean } | null })
                    .terminal_state ?? undefined;

                  const remoteWorkbenchState = (
                    data as { workbench_state?: { currentView: 'code' | 'preview'; showWorkbench: boolean } | null }
                  ).workbench_state ?? undefined;

                  const remoteEditorState = (
                    data as {
                      editor_state?: { selectedFile?: string; scrollPositions?: Record<string, { top: number; left: number }> } | null;
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

                const validFileCount = Object.keys(fileMap).length;

                if (validFileCount > 0) {
                  logger.info(`Attempting to restore ${validFileCount} valid files to WebContainer...`);

                  // Validate project structure before restoration
                  const { validateProject, getValidationSummary, formatValidationIssues } = await import(
                    '~/utils/project-validator'
                  );
                  const validation = validateProject(fileMap);

                  logger.info(`Project validation: ${getValidationSummary(validation)}`);

                  // Log validation issues if any
                  if (validation.issues.length > 0) {
                    validation.issues.forEach((issue) => {
                      const logMethod = issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warn' : 'info';
                      logger[logMethod](
                        `[${issue.severity.toUpperCase()}] ${issue.message}${issue.filePath ? ` (${issue.filePath})` : ''}`,
                      );
                    });

                    // Show validation summary to user if there are warnings or errors
                    const hasWarningsOrErrors = validation.issues.some(
                      (i) => i.severity === 'warning' || i.severity === 'error',
                    );

                    if (hasWarningsOrErrors) {
                      toast.info(`📋 Project validation: ${formatValidationIssues(validation.issues)}`, {
                        autoClose: 4000,
                      });
                    }
                  }

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

                    const wcResult = await waitForWebContainer({ timeout: 30000, throwOnTimeout: false });

                    if (!wcResult.ready || !wcResult.container) {
                      const error = new Error(
                        wcResult.error?.message || 'WebContainer failed to initialize within 30 seconds',
                      );
                      handleErrorWithAction(
                        {
                          operation: ERROR_TEMPLATES.webcontainerInit(),
                          error,
                        },
                        { showToast: true, toast },
                      );
                      throw error;
                    }

                    logger.info(`WebContainer ready after ${wcResult.timeWaited}ms, proceeding with file restoration`);

                    toast.update(restorationToast, {
                      render: `Restoring ${validFileCount} files...`,
                      isLoading: true,
                    });

                    // Restore files with progress tracking
                    const restorationResult = await workbenchStore.restoreFiles(fileMap, (current, total, fileName) => {
                      const percentage = Math.round((current / total) * 100);
                      toast.update(restorationToast, {
                        render: `Restoring files... ${current}/${total} (${percentage}%)${fileName ? ` - ${fileName}` : ''}`,
                        isLoading: true,
                      });
                    });

                    // Success! Update the toast with detailed summary
                    const { successCount, failedCount, retriedCount } = restorationResult;
                    let summary = `✅ Successfully restored ${successCount} file${successCount === 1 ? '' : 's'}`;

                    if (retriedCount > 0) {
                      summary += ` (${retriedCount} recovered after retry)`;
                    }

                    if (failedCount > 0) {
                      summary += `, ${failedCount} failed`;
                    }

                    toast.update(restorationToast, {
                      render: summary,
                      type: failedCount > 0 ? 'warning' : 'success',
                      isLoading: false,
                      autoClose: failedCount > 0 ? 5000 : 3000,
                      closeOnClick: true,
                      draggable: true,
                    });

                    logger.info(
                      `Restoration complete: ${successCount} succeeded, ${failedCount} failed, ${retriedCount} retried`,
                    );
                  } catch (error) {
                    logger.error('Failed to restore files to WebContainer:', error);

                    // Check if error has restoration result data (partial success)
                    const errorWithResult = error as Error & {
                      result?: { successCount: number; failedCount: number; retriedCount: number };
                    };

                    if (errorWithResult.result && errorWithResult.result.successCount > 0) {
                      // Partial success - some files were restored
                      const { successCount, failedCount, retriedCount } = errorWithResult.result;
                      toast.update(restorationToast, {
                        render: `⚠️ Partial restoration: ${successCount} succeeded, ${failedCount} failed${retriedCount > 0 ? ` (${retriedCount} retried)` : ''}`,
                        type: 'warning',
                        isLoading: false,
                        autoClose: 7000,
                        closeOnClick: true,
                        draggable: true,
                      });
                      logger.warn(
                        `Partial restoration: ${successCount} files restored, ${failedCount} failed after retries`,
                      );
                    } else {
                      // Complete failure - use actionable error
                      const actionableError = handleErrorWithAction(
                        {
                          operation: ERROR_TEMPLATES.fileRestoration(validFileCount),
                          error,
                          metadata: { fileCount: validFileCount },
                        },
                        { showToast: false, toast },
                      );

                      // Try fallback
                      try {
                        // Still set the files in the store as a fallback
                        workbenchStore.files.set(fileMap);
                        workbenchStore.setShowWorkbench(true);

                        toast.update(restorationToast, {
                          render: `⚠️ Restored ${validFileCount} files to editor only (WebContainer unavailable)\n\n💡 Try reloading the page`,
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
                          render: `❌ ${actionableError.title}: ${actionableError.message}\n\n💡 Try reloading the page or recreating the files`,
                          type: 'error',
                          isLoading: false,
                          autoClose: false,
                          closeOnClick: true,
                          draggable: true,
                        });
                      }
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
                  // Wait for files to be available in the store before selecting
                  // Using event-based approach instead of arbitrary timeout
                  const selectedFile = storedMessages.editorState.selectedFile;
                  const { waitForCondition } = await import('~/utils/sync-helpers');

                  try {
                    await waitForCondition(
                      () => {
                        const files = workbenchStore.files.get();
                        return !!files[selectedFile];
                      },
                      { timeout: 2000, interval: 50 },
                    );
                    workbenchStore.setSelectedFile(selectedFile);
                    logger.info(`Selected file restored: ${selectedFile}`);
                  } catch (timeoutError) {
                    // File not found, select it anyway (might appear later)
                    workbenchStore.setSelectedFile(selectedFile);
                    logger.warn(`Selected file ${selectedFile} not found yet, setting anyway`);
                  }
                }

                // Note: Scroll positions are stored but restoration requires deeper integration
                // with the editor store. This could be added in a future enhancement.
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

    // Wait for any ongoing file operations to complete before capturing state
    // Using event-based waiting instead of arbitrary timeout
    try {
      await waitForFileOperations(workbenchStore, { timeout: 2000, stabilityDelay: 100 });
      logger.debug('File operations settled, capturing state');
    } catch (error) {
      logger.warn('File operations did not settle within timeout, capturing state anyway');
    }

    // Capture terminal state
    const terminalState: TerminalState = {
      isVisible: workbenchStore.showTerminal.get(),
    };

    // Capture workbench state (view mode and visibility)
    const workbenchState: WorkbenchState = {
      currentView: workbenchStore.currentView.get(),
      showWorkbench: workbenchStore.showWorkbench.get(),
    };

    // Capture editor state (selected file)
    const editorState: EditorState = {
      selectedFile: workbenchStore.selectedFile.get(),
      // Note: Scroll positions are tracked per file in editor documents
      // but are not easily accessible from here. Could be added in the future.
    };

    // Get current file state from workbench store
    const currentFiles = workbenchStore.files.get();

    let fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }> | undefined;

    // Track file size statistics for logging
    let totalCapturedSize = 0;
    let skippedFileCount = 0;
    let skippedBySize = 0;
    let skippedByPattern = 0;

    if (currentFiles) {
      // Import encoding utilities
      const { encodeFileContent } = await import('~/utils/file-encoding');

      const processedEntries: Array<[string, { content: string; isBinary: boolean; encoding: 'plain' | 'base64' }]> =
        [];

      for (const [path, file] of Object.entries(currentFiles)) {
        // Skip non-file entries
        if (!file || file.type !== 'file' || file.content === undefined) {
          continue;
        }

        // Skip files matching exclusion patterns
        if (shouldExcludeFile(path)) {
          skippedFileCount++;
          skippedByPattern++;
          continue;
        }

        const isBinary = file.isBinary || false;

        // Encode binary files as base64 for storage
        const { content: encodedContent, encoding } = encodeFileContent(file.content, isBinary);

        // Check file size before adding
        const fileSize = getStringByteSize(encodedContent);
        const sizeCheck = wouldExceedSizeLimit(totalCapturedSize, fileSize);

        if (sizeCheck.exceeded) {
          logger.warn(`Skipping file ${path}: ${sizeCheck.reason}`);
          skippedFileCount++;
          skippedBySize++;
          continue;
        }

        // Add to processed entries and update size tracker
        processedEntries.push([
          path,
          {
            content: encodedContent,
            isBinary,
            encoding,
          },
        ]);
        totalCapturedSize += fileSize;
      }

      fileState = Object.fromEntries(processedEntries);

      // Log capture statistics
      if (processedEntries.length > 0) {
        logger.info(
          `Captured ${processedEntries.length} files (${formatBytes(totalCapturedSize)}) for chat history`,
        );

        if (skippedFileCount > 0) {
          logger.info(
            `Skipped ${skippedFileCount} files: ${skippedByPattern} by pattern, ${skippedBySize} by size limit`,
          );
        }

        // Show user notifications about file size issues
        if (skippedBySize > 0) {
          toast.warning(
            `⚠️ Skipped ${skippedBySize} large ${skippedBySize === 1 ? 'file' : 'files'} (max ${formatBytes(FILE_SIZE_LIMITS.MAX_FILE_SIZE)} per file, ${formatBytes(FILE_SIZE_LIMITS.MAX_TOTAL_SIZE)} total)`,
            {
              autoClose: 5000,
            },
          );
        } else if (totalCapturedSize >= FILE_SIZE_LIMITS.WARNING_THRESHOLD) {
          // Warn if approaching the limit
          const percentUsed = Math.round((totalCapturedSize / FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) * 100);
          toast.info(
            `ℹ️ Project size: ${formatBytes(totalCapturedSize)} (${percentUsed}% of ${formatBytes(FILE_SIZE_LIMITS.MAX_TOTAL_SIZE)} limit)`,
            {
              autoClose: 4000,
            },
          );
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
