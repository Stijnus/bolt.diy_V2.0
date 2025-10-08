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

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: UIMessage[];
  timestamp: string;
  model?: FullModelId;
  origin?: 'local' | 'remote';
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
     * Save to IndexedDB (for offline support and fallback) - only for guest users
     * For logged-in users, Supabase is the primary storage
     */
    if (!user) {
      await setMessages(
        database,
        currentChatId as string,
        messages,
        currentUrlId,
        description.get(),
        selection,
        undefined,
        'local',
      );
    }

    // Also save to Supabase if user is logged in
    if (user) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();
        const finalUrlId = currentUrlId || currentChatId;

        /*
         * Skip Supabase sync if we don't have a proper urlId yet (waiting for artifact)
         * This prevents creating duplicate chats with generic IDs like "1"
         */
        if (!currentUrlId || currentUrlId === currentChatId) {
          logger.info('Skipping Supabase sync - waiting for proper urlId from artifact');
          return;
        }

        // Use upsert to insert or update the chat
        const { error } = await supabase.from('chats').upsert(
          {
            url_id: finalUrlId,
            user_id: user.id,
            messages: messages as any,
            description: description.get() || null,
            model: selection, // Fix: Include model field
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
