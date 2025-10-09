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
import { createScopedLogger } from '~/utils/logger';

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
                      throw new Error(
                        wcResult.error?.message || 'WebContainer failed to initialize within 30 seconds',
                      );
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

                    logger.info(`Successfully restored ${validFileCount} files to WebContainer`);
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
    await new Promise((resolve) => setTimeout(resolve, 100));

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
