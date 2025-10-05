import { useLoaderData, useNavigate } from '@remix-run/react';
import type { UIMessage } from 'ai';
import { atom } from 'nanostores';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';
import { currentModel, parseFullModelId, setChatModel, setCurrentModel } from '~/lib/stores/model';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FullModelId } from '~/types/model';
import { useAuth } from '~/lib/contexts/AuthContext';
import { createClient } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';

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
          const storedMessages = await getMessages(database, mixedId);

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
  }, [mixedId, navigate]);

  return {
    ready: !mixedId || ready,
    initialMessages,
    storeMessageHistory: async (messages: UIMessage[], modelFullId?: FullModelId) => {
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

      if (!urlId && firstArtifact?.id) {
        const urlId = await getUrlId(database, firstArtifact.id);

        navigateChat(urlId);
        setUrlId(urlId);
      }

      if (!description.get() && firstArtifact?.title) {
        description.set(firstArtifact?.title);
      }

      if (initialMessages.length === 0 && !chatId.get()) {
        const nextId = await getNextId(database);

        chatId.set(nextId);

        const currentSelection = currentModel.get();
        setChatModel(nextId, currentSelection.provider, currentSelection.modelId);

        if (!urlId) {
          navigateChat(nextId);
        }
      }

      const selection = modelFullId ?? currentModel.get().fullId;

      // Save to IndexedDB (for offline support and fallback)
      await setMessages(
        database,
        chatId.get() as string,
        messages,
        urlId,
        description.get(),
        selection,
        undefined,
        'local',
      );

      // Also save to Supabase if user is logged in
      if (user) {
        try {
          setSyncing(true);
          setConnectionError(null);

          const supabase = createClient();
          const currentChatId = chatId.get() as string;
          const currentUrlId = urlId || currentChatId;

          // Use upsert to insert or update the chat
          const { error } = await supabase.from('chats').upsert(
            {
              url_id: currentUrlId,
              user_id: user.id,
              messages: messages as any,
              description: description.get() || null,
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
            logger.info(`Chat ${currentUrlId} synced to Supabase`);
          }
        } catch (error) {
          logger.error('Error syncing to Supabase:', error);
          setConnectionError(`Sync error: ${(error as Error).message}`);
          // Don't throw - we still have IndexedDB backup
        } finally {
          setSyncing(false);
        }
      }
    },
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
