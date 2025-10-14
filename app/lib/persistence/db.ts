import type { UIMessage } from 'ai';
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
  console.log('[DB] openDatabase called');

  return new Promise((resolve) => {
    // Version 4: Added app_settings store; v3 fixed urlId unique constraint
    const request = indexedDB.open('boltHistory', 5);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      console.log('[DB] Database upgrade needed, current version:', event.oldVersion);

      const db = (event.target as IDBOpenDBRequest).result;
      const currentVersion = event.oldVersion;

      // Create chats store if it doesn't exist
      if (!db.objectStoreNames.contains('chats')) {
        console.log('[DB] Creating chats store');

        const store = db.createObjectStore('chats', { keyPath: 'id' });
        store.createIndex('id', 'id', { unique: true });
        store.createIndex('urlId', 'urlId', { unique: false });
        store.createIndex('urlId_userId', ['urlId', 'userId'], { unique: true });
        store.createIndex('projectId', 'projectId', { unique: false });
      } else {
        const chatsStore = (event.target as IDBOpenDBRequest).transaction!.objectStore('chats');

        if (currentVersion < 3) {
          // Version 3: Fix the urlId unique constraint issue

          // Delete the old unique urlId index if it exists
          if (chatsStore.indexNames.contains('urlId')) {
            chatsStore.deleteIndex('urlId');
          }

          // Create new non-unique urlId index and composite unique index
          chatsStore.createIndex('urlId', 'urlId', { unique: false });
          chatsStore.createIndex('urlId_userId', ['urlId', 'userId'], { unique: true });
        }

        if (currentVersion < 5 && !chatsStore.indexNames.contains('projectId')) {
          chatsStore.createIndex('projectId', 'projectId', { unique: false });
        }
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

      // Version 4: Add app_settings store for guest settings persistence
      if (!db.objectStoreNames.contains('app_settings')) {
        const settingsStore = db.createObjectStore('app_settings', { keyPath: 'id' });
        settingsStore.createIndex('id', 'id', { unique: true });
      }
    };

    request.onsuccess = (event: Event) => {
      console.log('[DB] Database opened successfully');
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.error('[DB] Database failed to open:', (event.target as IDBOpenDBRequest).error);
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
  fileState?: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>,
  terminalState?: { isVisible: boolean },
  workbenchState?: { currentView: 'code' | 'preview'; showWorkbench: boolean },
  editorState?: { selectedFile?: string; scrollPositions?: Record<string, { top: number; left: number }> },
  projectId?: string | null,
): Promise<void> {
  console.log('[DB] setMessages called for:', id, 'messages:', messages.length);

  // Validate input parameters
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid or missing chat ID');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  // Validate message structure
  for (const [index, message] of messages.entries()) {
    if (!message || typeof message !== 'object') {
      throw new Error(`Invalid message at index ${index}: not an object`);
    }

    if (!message.role || typeof message.role !== 'string') {
      throw new Error(`Invalid message at index ${index}: missing or invalid role`);
    }
  }

  // Validate and clean file state if present
  let cleanFileState = fileState;

  if (fileState) {
    cleanFileState = Object.fromEntries(
      Object.entries(fileState).filter(([path, fileData]) => {
        const isValidPath = path && typeof path === 'string' && path.trim() !== '';

        const isValidFileData =
          fileData && typeof fileData === 'object' && 'content' in fileData && typeof fileData.content === 'string';

        if (!isValidPath || !isValidFileData) {
          logger.warn(`Skipping invalid file data for path: ${path}`);
          return false;
        }

        // Additional validation for file size (prevent extremely large files)
        const contentLength = fileData.content.length;

        if (contentLength > 5 * 1024 * 1024) {
          // 5MB limit
          logger.warn(`Skipping large file ${path}: ${contentLength} bytes exceeds 5MB limit`);
          return false;
        }

        // Skip binary files that are too large to store efficiently
        const isBinary = fileData.isBinary || false;

        if (isBinary && contentLength > 1024 * 1024) {
          // 1MB limit for binary files
          logger.warn(`Skipping large binary file ${path}: ${contentLength} bytes exceeds 1MB limit`);
          return false;
        }

        return true;
      }),
    );
  }

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');

    const recordTimestamp = timestamp ?? new Date().toISOString();

    const request = store.put({
      id: id.trim(),
      messages,
      urlId: urlId?.trim() || id.trim(),
      description: description?.trim() || undefined,
      model: model?.trim() || undefined,
      timestamp: recordTimestamp,
      origin,
      fileState: cleanFileState,
      terminalState,
      workbenchState,
      editorState,
      projectId: projectId ?? null,
    });

    request.onsuccess = () => {
      console.log('[DB] setMessages completed successfully for:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('[DB] setMessages failed for:', id, request.error);
      reject(request.error);
    };
  });
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

// Generate a consistent, reliable chat ID
export function generateChatId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 11);

  return `chat-${timestamp}-${randomPart}`;
}

// Generate a proper description for a chat based on its messages
export function generateChatDescription(messages: any[]): string {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'New Chat';
  }

  // Try to find the first user message
  const firstUserMessage = messages.find((msg) => msg.role === 'user');

  if (firstUserMessage) {
    let content = '';

    // Handle different message formats
    if (typeof firstUserMessage.content === 'string') {
      content = firstUserMessage.content;
    } else if (Array.isArray(firstUserMessage.parts)) {
      // Extract text content from parts
      const textParts = firstUserMessage.parts.filter(
        (part: any) => part?.type === 'text' && typeof part.text === 'string',
      );
      content = textParts.map((part: any) => part.text).join('');
    }

    // Clean up and truncate the content
    if (content && content.trim()) {
      const cleaned = content.trim().replace(/[\r\n]+/g, ' ');
      return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
    }
  }

  // Fallback to the first message if no user message found
  const firstMessage = messages[0];

  if (firstMessage) {
    const role = firstMessage.role || 'Unknown';
    return `${role.charAt(0).toUpperCase() + role.slice(1)} message`;
  }

  return 'New Chat';
}

// Validate that a chat ID is in the expected format
export function isValidChatId(id: string): boolean {
  if (typeof id !== 'string' || id.trim() === '') {
    return false;
  }

  // Check for our standard format: chat-timestamp-random
  const chatIdPattern = /^chat-\d{13}-[a-z0-9]{9}$/;

  return chatIdPattern.test(id);
}

// Legacy getNextId function for backward compatibility
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
      resolve(generateChatId()); // Use the new consistent ID generator
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
        // No valid numeric IDs found, use the new consistent ID generator
        resolve(generateChatId());
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

// --- Usage tracking functions -
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

// Enhanced cleanup function to remove invalid chat entries and fix data integrity issues
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
          chat.id === '-Infinity' ||
          typeof chat.id !== 'string' ||
          chat.id.trim() === ''
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
          chat.urlId === '-Infinity' ||
          typeof chat.urlId !== 'string' ||
          chat.urlId.trim() === ''
        ) {
          return true;
        }

        // Check for empty or invalid messages array
        if (!Array.isArray(chat.messages) || chat.messages.length === 0) {
          return true;
        }

        // Check for invalid timestamp
        if (
          !chat.timestamp ||
          chat.timestamp === 'NaN' ||
          chat.timestamp === 'undefined' ||
          chat.timestamp === 'null' ||
          typeof chat.timestamp !== 'string'
        ) {
          return true;
        }

        // Check for missing or empty description (when it's not a valid fallback to urlId)
        if (!chat.description || typeof chat.description !== 'string' || chat.description.trim() === '') {
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

      logger.info(`Found ${invalidChats.length} invalid chat entries to clean up`);

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
          logger.error(`Failed to delete invalid chat ${chat.id}:`, deleteRequest.error);
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

// Comprehensive database repair function
export async function repairDatabase(db: IDBDatabase): Promise<{
  cleanedInvalid: number;
  fixedInconsistent: number;
  totalProcessed: number;
}> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => {
      const allChats = request.result as ChatHistoryItem[];

      let cleanedInvalid = 0;
      let fixedInconsistent = 0;
      let pendingOperations = 0;

      logger.info(`Starting database repair for ${allChats.length} chat entries`);

      // Group 1: Remove completely invalid entries
      const invalidChats = allChats.filter((chat) => {
        return (
          !chat.id ||
          chat.id === 'NaN' ||
          chat.id === 'undefined' ||
          chat.id === 'null' ||
          chat.id === 'Infinity' ||
          chat.id === '-Infinity' ||
          typeof chat.id !== 'string' ||
          chat.id.trim() === '' ||
          !Array.isArray(chat.messages) ||
          chat.messages.length === 0
        );
      });

      // Group 2: Fix entries with inconsistent id/urlId
      const fixableChats = allChats.filter((chat) => {
        return !invalidChats.includes(chat) && chat.id && chat.urlId && chat.id !== chat.urlId;
      });

      pendingOperations = invalidChats.length + fixableChats.length;

      if (pendingOperations === 0) {
        resolve({
          cleanedInvalid: 0,
          fixedInconsistent: 0,
          totalProcessed: allChats.length,
        });
        return;
      }

      let completedOperations = 0;

      // Remove invalid entries
      invalidChats.forEach((chat) => {
        const deleteRequest = store.delete(chat.id);

        deleteRequest.onsuccess = () => {
          cleanedInvalid++;
          completedOperations++;
          checkComplete();
        };

        deleteRequest.onerror = () => {
          logger.error(`Failed to delete invalid chat ${chat.id}:`, deleteRequest.error);
          completedOperations++;
          checkComplete();
        };
      });

      // Fix inconsistent entries
      fixableChats.forEach((chat) => {
        const fixedChat = {
          ...chat,
          urlId: chat.id, // Make urlId consistent with id
          timestamp: chat.timestamp || new Date().toISOString(),
        };

        const updateRequest = store.put(fixedChat);

        updateRequest.onsuccess = () => {
          fixedInconsistent++;
          completedOperations++;
          checkComplete();
        };

        updateRequest.onerror = () => {
          logger.error(`Failed to fix chat ${chat.id}:`, updateRequest.error);
          completedOperations++;
          checkComplete();
        };
      });

      function checkComplete() {
        if (completedOperations === pendingOperations) {
          logger.info(
            `Database repair completed: ${cleanedInvalid} invalid entries removed, ${fixedInconsistent} entries fixed`,
          );
          resolve({
            cleanedInvalid,
            fixedInconsistent,
            totalProcessed: allChats.length,
          });
        }
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// --- App Settings (guest) persistence ---
export async function getAppSettings(db: IDBDatabase): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('app_settings', 'readonly');
      const store = tx.objectStore('app_settings');
      const req = store.get('guest');
      req.onsuccess = () => resolve((req.result as any) ?? null);
      req.onerror = () => reject(req.error);
    } catch {
      resolve(null);
    }
  });
}

export async function setAppSettings(db: IDBDatabase, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('app_settings', 'readwrite');
      const store = tx.objectStore('app_settings');
      const record = { id: 'guest', settings, updatedAt: new Date().toISOString() };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch {
      resolve();
    }
  });
}
