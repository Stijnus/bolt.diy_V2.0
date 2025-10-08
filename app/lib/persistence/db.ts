import type { UIMessage } from 'ai';
import { withRetry } from './timeout-wrapper';
import type { ChatHistoryItem } from './useChatHistory';
import type { SessionUsage } from '~/lib/stores/usage';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatHistory');

export type SessionUsageWithTimestamp = SessionUsage & { timestamp: string };

let dbPromise: Promise<IDBDatabase | undefined> | undefined;

export async function getDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof window === 'undefined') {
    return undefined;
  }

  if (!dbPromise) {
    dbPromise = openDatabase();
  }

  return dbPromise;
}

// this is used at the top level and never rejects
export async function openDatabase(): Promise<IDBDatabase | undefined> {
  return new Promise((resolve) => {
    // Version 3: Fixed urlId unique constraint to match Supabase schema
    const request = indexedDB.open('boltHistory', 3);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const currentVersion = event.oldVersion;

      // Create chats store if it doesn't exist
      if (!db.objectStoreNames.contains('chats')) {
        const store = db.createObjectStore('chats', { keyPath: 'id' });
        store.createIndex('id', 'id', { unique: true });
        store.createIndex('urlId', 'urlId', { unique: false });
        store.createIndex('urlId_userId', ['urlId', 'userId'], { unique: true });
      } else if (currentVersion < 3) {
        // Version 3: Fix the urlId unique constraint issue
        const store = (event.target as IDBOpenDBRequest).transaction!.objectStore('chats');

        // Delete the old unique urlId index if it exists
        if (store.indexNames.contains('urlId')) {
          store.deleteIndex('urlId');
        }

        // Create new non-unique urlId index and composite unique index
        store.createIndex('urlId', 'urlId', { unique: false });
        store.createIndex('urlId_userId', ['urlId', 'userId'], { unique: true });
      }

      if (!db.objectStoreNames.contains('usage')) {
        const usageStore = db.createObjectStore('usage', { autoIncrement: true });
        usageStore.createIndex('timestamp', 'timestamp', { unique: false });
      } else if (currentVersion < 2) {
        /*
         * Version 2: Added 'usage' object store (for completeness)
         * This is handled by the initial creation check above
         */
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      resolve(undefined);
      logger.error((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getAll(db: IDBDatabase): Promise<ChatHistoryItem[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function setMessages(
  db: IDBDatabase,
  id: string,
  messages: UIMessage[],
  urlId?: string,
  description?: string,
  model?: string,
  timestamp?: string,
  origin: 'local' | 'remote' = 'local',
  fileState?: Record<string, { content: string; isBinary: boolean }>,
): Promise<void> {
  return withRetry(
    async () => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('chats', 'readwrite');
        const store = transaction.objectStore('chats');

        const recordTimestamp = timestamp ?? new Date().toISOString();

        const request = store.put({
          id,
          messages,
          urlId,
          description,
          model,
          timestamp: recordTimestamp,
          origin,
          fileState,
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    {
      maxRetries: 3,
      timeout: 15000, // 15 seconds for file operations
      operationName: 'setMessages',
    },
  );
}

export async function getMessages(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(db, id)) || (await getMessagesByUrlId(db, id));
}

export async function getMessagesByUrlId(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const index = store.index('urlId');
    const request = index.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesById(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteById(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.delete(id);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function getNextId(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');

    // Use cursor-based approach for better performance with large datasets
    const request = store.openCursor(null, 'prev'); // Start from the end

    let highestNumericId = 0;
    let foundValidId = false;

    // Add timeout to prevent infinite waits
    const timeout = setTimeout(() => {
      logger.warn('getNextId operation timed out, using fallback ID');
      resolve(String(Date.now()));
    }, 5000); // 5 second timeout

    request.onsuccess = (event: Event) => {
      clearTimeout(timeout);

      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor && !foundValidId) {
        const id = cursor.key as string;
        const num = Number(id);

        // Check if this is a valid numeric ID
        if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
          highestNumericId = Math.max(highestNumericId, num);
          foundValidId = true;

          // Since we're going backwards (prev), we can stop at the first valid numeric ID
          resolve(String(highestNumericId + 1));

          return;
        }

        // Continue to previous entry
        cursor.continue();
      } else if (!foundValidId) {
        // No valid numeric IDs found, start with '1'
        resolve('1');
      }

      // If we already found a valid ID and resolved, we don't need to do anything
    };

    request.onerror = () => {
      clearTimeout(timeout);
      logger.error('Failed to open cursor in getNextId:', request.error);
      reject(request.error);
    };
  });
}

export async function getUrlId(db: IDBDatabase, id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const index = store.index('urlId');

    // First check if the base ID exists
    const getRequest = index.get(id);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        // Base ID is available, use it
        resolve(id);
        return;
      }

      // Base ID exists, find the next available suffixed ID
      let suffix = 2;

      const checkNextId = () => {
        const testId = `${id}-${suffix}`;
        const checkRequest = index.get(testId);

        checkRequest.onsuccess = () => {
          if (!checkRequest.result) {
            // Found an available ID
            resolve(testId);
          } else {
            // ID exists, try next
            suffix++;
            checkNextId();
          }
        };

        checkRequest.onerror = () => {
          logger.error('Error checking URL ID availability:', checkRequest.error);
          reject(checkRequest.error);
        };
      };

      // Start checking suffixed IDs
      checkNextId();
    };

    getRequest.onerror = () => {
      logger.error('Error checking base URL ID:', getRequest.error);
      reject(getRequest.error);
    };
  });
}

// getUrlIds function removed - no longer needed with atomic getUrlId implementation

// --- Usage tracking functions ---

export async function saveUsage(db: IDBDatabase, usage: SessionUsage): Promise<void> {
  return new Promise((resolve, reject) => {
    if (usage.tokens.input === 0 && usage.tokens.output === 0) {
      // Don't save empty usage records
      resolve();
      return;
    }

    const transaction = db.transaction('usage', 'readwrite');
    const store = transaction.objectStore('usage');
    const recordToStore = { ...usage, timestamp: new Date().toISOString() };
    const request = store.add(recordToStore);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUsage(db: IDBDatabase): Promise<SessionUsageWithTimestamp[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('usage', 'readonly');
    const store = transaction.objectStore('usage');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as SessionUsageWithTimestamp[]);
    request.onerror = () => reject(request.error);
  });
}

// Cleanup function to remove invalid chat entries with NaN or invalid IDs
export async function cleanupInvalidChatEntries(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => {
      const allChats = request.result as ChatHistoryItem[];

      const invalidChats = allChats.filter((chat) => {
        // Check for invalid IDs
        if (
          !chat.id ||
          chat.id === 'NaN' ||
          chat.id === 'undefined' ||
          chat.id === 'null' ||
          chat.id === 'Infinity' ||
          chat.id === '-Infinity'
        ) {
          return true;
        }

        // Check for invalid urlId
        if (
          !chat.urlId ||
          chat.urlId === 'NaN' ||
          chat.urlId === 'undefined' ||
          chat.urlId === 'null' ||
          chat.urlId === 'Infinity' ||
          chat.urlId === '-Infinity'
        ) {
          return true;
        }

        return false;
      });

      if (invalidChats.length === 0) {
        resolve(0);
        return;
      }

      let deletedCount = 0;
      let pendingDeletes = invalidChats.length;

      invalidChats.forEach((chat) => {
        const deleteRequest = store.delete(chat.id);

        deleteRequest.onsuccess = () => {
          deletedCount++;
          pendingDeletes--;

          if (pendingDeletes === 0) {
            logger.info(`Cleaned up ${deletedCount} invalid chat entries`);
            resolve(deletedCount);
          }
        };

        deleteRequest.onerror = () => {
          pendingDeletes--;

          if (pendingDeletes === 0) {
            logger.info(`Cleaned up ${deletedCount} invalid chat entries`);
            resolve(deletedCount);
          }
        };
      });
    };

    request.onerror = () => reject(request.error);
  });
}
