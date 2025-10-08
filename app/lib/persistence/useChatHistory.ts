import { useLoaderData, useNavigate } from '@remix-run/react';
import type { UIMessage } from 'ai';
import { atom } from 'nanostores';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';
import { createFileState } from './file-state-cache';
import { executeWithQueue } from './message-queue';
import { useAuth } from '~/lib/contexts/AuthContext';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { currentModel, parseFullModelId, setChatModel, setCurrentModel } from '~/lib/stores/model';
import { workbenchStore } from '~/lib/stores/workbench';
import { createClient } from '~/lib/supabase/client';
import type { FullModelId } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatHistory');

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: UIMessage[];
  timestamp: string;
  model?: FullModelId;
  origin?: 'local' | 'remote';
  fileState?: Record<string, { content: string; isBinary: boolean }>;
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

                  await setMessages(
                    database,
                    remoteUrlId,
                    remoteMessages,
                    remoteUrlId,
                    remoteDescription,
                    remoteModel,
                    remoteTimestamp,
                    'remote',
                    (data as any)?.fileState || undefined,
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
              const fileMap: Record<string, { type: 'file'; content: string; isBinary: boolean }> = {};

              Object.entries(storedMessages.fileState).forEach(([path, fileData]) => {
                fileMap[path] = {
                  type: 'file',
                  content: fileData.content,
                  isBinary: fileData.isBinary,
                };
              });

              try {
                await workbenchStore.restoreFiles(fileMap);
                logger.info(`Restored ${Object.keys(fileMap).length} files to WebContainer`);
              } catch (error) {
                logger.error('Failed to restore files to WebContainer:', error);
                toast.error('Failed to restore some files from project history');

                // Still set the files in the store as a fallback
                workbenchStore.files.set(fileMap);
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

  const storeMessageHistoryRef = useRef<(messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>>(
    async () => {
      // Default empty implementation
    },
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStoreRef = useRef<{ messages: UIMessage[]; modelFullId?: FullModelId } | null>(null);

  storeMessageHistoryRef.current = async (messages: UIMessage[], modelFullId?: FullModelId) => {
    if (messages.length === 0) {
      return;
    }

    if (!persistenceEnabled || typeof window === 'undefined') {
      return;
    }

    // Log potential race condition detection
    const lastMessage = messages[messages.length - 1];
    const messageId = lastMessage?.id || 'unknown';
    logger.debug(`Store message history called for ${messageId}, current urlId: ${urlId}, chatId: ${chatId.get()}`);

    // Use the message queue to prevent concurrent operations
    void executeWithQueue(
      messages,
      async (msgs, mdlFullId) => {
        // Clear any existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Store the latest request
        pendingStoreRef.current = { messages: msgs, modelFullId: mdlFullId };

        // Debounce the operation to prevent rapid successive saves
        return new Promise<void>((resolve, reject) => {
          debounceTimerRef.current = setTimeout(async () => {
            const currentPending = pendingStoreRef.current;

            if (!currentPending) {
              resolve();
              return;
            }

            try {
              // Log before storing to detect potential issues
              logger.debug(
                `Storing ${currentPending.messages.length} messages for urlId: ${urlId}, chatId: ${chatId.get()}`,
              );
              await performStoreOperation(currentPending.messages, currentPending.modelFullId);
              logger.debug(`Successfully stored messages for urlId: ${urlId}`);
              resolve();
            } catch (error) {
              logger.error('Failed to store message history:', error);
              reject(error);
            }
          }, 500); // 500ms debounce
        });
      },
      modelFullId,
    );
  };

  const performStoreOperation = async (messages: UIMessage[], modelFullId?: FullModelId) => {
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
    let currentChatId = chatId.get();

    // Only generate URL ID once - if we already have one, don't regenerate
    if (!currentUrlId && firstArtifact?.id) {
      const generatedUrlId = await getUrlId(database, firstArtifact.id);

      navigateChat(generatedUrlId);
      setUrlId(generatedUrlId);
      currentUrlId = generatedUrlId; // Use local variable immediately

      // If we had a temporary chat ID and now have a proper urlId, update Supabase
      if (user && currentChatId && currentChatId !== generatedUrlId) {
        try {
          const supabase = createClient();

          // Update the chat record to use the proper urlId
          const { error: updateError } = await supabase
            .from('chats')
            .update({ url_id: generatedUrlId })
            .eq('user_id', user.id)
            .eq('url_id', currentChatId);

          if (updateError) {
            logger.error('Failed to update chat urlId in Supabase:', updateError);
          } else {
            logger.info(`Updated chat urlId from ${currentChatId} to ${generatedUrlId} in Supabase`);
          }
        } catch (error) {
          logger.error('Error updating chat urlId:', error);
        }
      }
    }

    if (!description.get() && firstArtifact?.title) {
      description.set(firstArtifact?.title);
    }

    if (initialMessages.length === 0 && !currentChatId) {
      const nextId = await getNextId(database);

      // Validate the generated ID before using it
      if (!nextId || nextId === 'NaN' || nextId === 'undefined' || nextId === 'null') {
        logger.error('Invalid chat ID generated:', nextId);
        throw new Error('Failed to generate valid chat ID');
      }

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
     * Always save to IndexedDB as backup (for offline support and quick access)
     * Include file state in the saved chat
     * Use cached file state to avoid expensive serialization
     */
    const currentFiles = workbenchStore.files.get();
    const fileState = createFileState(currentChatId || 'temp', currentFiles);

    await setMessages(
      database,
      currentChatId as string,
      messages,
      currentUrlId,
      description.get(),
      selection,
      undefined,
      user ? 'remote' : 'local',
      fileState,
    );

    // Also save to Supabase if user is logged in
    if (user) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();
        const finalUrlId = currentUrlId || currentChatId;

        /*
         * Always sync to Supabase, even if we only have a temporary ID
         * The upsert with onConflict will handle updates when we get a proper urlId
         */

        // Additional safeguard: check if this exact chat already exists to prevent duplicates
        const { data: existingChat } = await supabase
          .from('chats')
          .select('id, url_id, updated_at')
          .eq('user_id', user.id)
          .eq('url_id', finalUrlId)
          .single();

        if (existingChat) {
          // Chat exists, update it instead of creating duplicate
          const { error: updateError } = await supabase
            .from('chats')
            .update({
              messages: messages as any,
              description: description.get() || null,
              model: selection,
              file_state: fileState,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingChat.id);

          if (updateError) {
            logger.error('Failed to update existing chat in Supabase:', updateError);
            setConnectionError(`Sync failed: ${updateError.message}`);
          } else {
            logger.debug(`Updated existing chat ${finalUrlId} in Supabase`);
          }
        } else {
          // Chat doesn't exist, create new one
          const { error: insertError } = await supabase.from('chats').insert({
            url_id: finalUrlId,
            user_id: user.id,
            messages: messages as any,
            description: description.get() || null,
            model: selection,
            file_state: fileState,
            updated_at: new Date().toISOString(),
          });

          if (insertError) {
            logger.error('Failed to create new chat in Supabase:', insertError);
            setConnectionError(`Sync failed: ${insertError.message}`);
          } else {
            logger.debug(`Created new chat ${finalUrlId} in Supabase`);
          }
        }

        /*
         * Note: We removed the upsert with onConflict to have more control
         * over duplicate prevention and better error handling
         */
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
    storeMessageHistory: (...args: Parameters<typeof storeMessageHistoryRef.current>) =>
      storeMessageHistoryRef.current(...args),
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
