/**
 * @deprecated This file is deprecated and no longer used.
 * The sync functionality has been simplified and moved directly into useChatHistory.ts.
 * This file remains for reference purposes only and should be removed in a future cleanup.
 *
 * The new approach uses:
 * - Direct IndexedDB operations via db.ts
 * - Simple Supabase integration in useChatHistory.ts
 * - File state capture directly in the storeMessageHistory function
 * - No complex queuing, caching, or debouncing systems
 */

import type { UIMessage } from 'ai';
import { getDatabase, setMessages, cleanupInvalidChatEntries, getMessages, repairDatabase, getAll } from './db';
import { setSyncing, setConnectionError, setQueueSize } from '~/lib/stores/connection';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FullModelId } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SyncManager');

export interface SyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  debounceMs?: number;
  enableLogging?: boolean;
}

export interface ChatSyncData {
  id: string;
  urlId?: string;
  messages: UIMessage[];
  description?: string;
  model?: FullModelId;
  fileState?: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  origin?: 'local' | 'remote';
  timestamp?: string;
}

interface QueuedSync {
  id: string;
  data: ChatSyncData;
  timestamp: number;
  resolve: () => void;
  reject: (error: Error) => void;
  retries: number;
}

export class SyncManager {
  private _queue: QueuedSync[] = [];
  private _processing = false;
  private _debounceTimer: NodeJS.Timeout | null = null;
  private _pendingSync: ChatSyncData | null = null;

  private readonly _options: Required<SyncOptions>;
  private readonly _maxQueueSize = 10;
  private readonly _debounceMs = 1000; // Increased from 500ms to reduce rapid saves

  constructor(options: SyncOptions = {}) {
    this._options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 15000,
      debounceMs: 1000,
      enableLogging: true,
      ...options,
    };
  }

  /**
   * Sync chat data with local IndexedDB only with enhanced validation (Supabase removed)
   */
  async syncChat(data: ChatSyncData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log('[SyncManager] syncChat called for:', data.id, 'messages:', data.messages.length);

      // Validate input data before queuing
      if (!this._validateChatData(data)) {
        const error = new Error('Invalid chat data provided to syncChat');
        logger.error('Sync validation failed:', { id: data.id, messageCount: data.messages?.length });
        reject(error);

        return;
      }

      if (this._options.enableLogging) {
        logger.debug(`Queueing sync for chat ${data.id}, urlId: ${data.urlId}`);
      }

      const sync: QueuedSync = {
        id: this._generateSyncId(data),
        data,
        timestamp: Date.now(),
        resolve,
        reject,
        retries: 0,
      };

      // Remove existing sync for same chat to prevent duplicates
      this._removeExistingSync(data.id);

      // Check queue size to prevent memory issues
      if (this._queue.length >= this._maxQueueSize) {
        logger.warn(`Sync queue full (${this._queue.length}), removing oldest sync`);

        const oldest = this._queue.shift();

        if (oldest) {
          oldest.reject(new Error('Sync queue overflow - removed oldest sync'));
        }
      }

      // Add new sync to queue
      this._queue.push(sync);
      this._updateQueueStatus();

      // Start processing
      this._processQueue();
    });
  }

  /**
   * Load chat history from local storage only with enhanced error handling
   */
  async loadChatHistory(id: string): Promise<ChatSyncData | null> {
    try {
      const database = await getDatabase();

      if (!database) {
        throw new Error('Database not available');
      }

      // Validate input ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        logger.warn('Invalid chat ID provided to loadChatHistory:', id);
        return null;
      }

      // Load from IndexedDB with fallback strategies
      let storedData = await this._loadFromIndexedDB(database, id);

      // If direct lookup failed, try alternative lookup methods
      if (!storedData) {
        logger.debug(`Direct lookup failed for ${id}, trying alternative methods`);

        // Try loading by URL ID if different from chat ID
        if (id !== id) {
          storedData = await this._loadFromIndexedDB(database, id);
        }

        // Try to find chats with similar IDs (for legacy data)
        if (!storedData) {
          storedData = await this._loadFromIndexedDBFallback(database, id);
        }
      }

      if (storedData) {
        // Validate the loaded data
        if (!this._validateChatData(storedData)) {
          logger.warn(`Invalid chat data loaded for ${id}, discarding`);
          return null;
        }

        // Ensure required fields are present
        if (!storedData.description) {
          storedData.description = 'Restored Chat';
          logger.info(`Added missing description for chat ${id}`);
        }

        if (!storedData.timestamp) {
          storedData.timestamp = new Date().toISOString();
          logger.info(`Added missing timestamp for chat ${id}`);
        }
      }

      return storedData;
    } catch (error) {
      logger.error('Failed to load chat history:', error);
      throw error;
    }
  }

  /**
   * Clean up invalid entries and optimize storage
   */
  async cleanup(): Promise<{
    indexedDBCleaned: number;
    queueCleared: number;
    databaseRepaired?: { cleanedInvalid: number; fixedInconsistent: number; totalProcessed: number };
  }> {
    let indexedDBCleaned = 0;
    let queueCleared = 0;
    let databaseRepaired: { cleanedInvalid: number; fixedInconsistent: number; totalProcessed: number } | undefined;

    try {
      const database = await getDatabase();

      if (database) {
        // First run the comprehensive repair function
        try {
          databaseRepaired = await repairDatabase(database);
          indexedDBCleaned = databaseRepaired.cleanedInvalid;
        } catch (repairError) {
          logger.warn('Database repair failed, falling back to basic cleanup:', repairError);
          indexedDBCleaned = await cleanupInvalidChatEntries(database);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup IndexedDB:', error);
    }

    // Clear pending queue operations
    queueCleared = this._queue.length;
    this._queue = [];
    this._updateQueueStatus();

    if (this._options.enableLogging) {
      logger.info(
        `Cleanup completed: ${indexedDBCleaned} DB entries, ${queueCleared} queue operations${databaseRepaired ? `, ${databaseRepaired.fixedInconsistent} entries fixed` : ''}`,
      );
    }

    return { indexedDBCleaned, queueCleared, databaseRepaired };
  }

  private async _processQueue(): Promise<void> {
    if (this._processing || this._queue.length === 0) {
      return;
    }

    this._processing = true;
    setSyncing(true);
    setConnectionError(null);

    try {
      while (this._queue.length > 0) {
        const sync = this._queue.shift()!;
        this._updateQueueStatus();

        try {
          // Validate sync data before processing
          if (!this._validateChatData(sync.data)) {
            throw new Error('Invalid chat data in sync queue');
          }

          await this._processSync(sync);
          sync.resolve();
        } catch (error) {
          await this._handleSyncError(sync, error instanceof Error ? error : new Error(String(error)));
        }
      }
    } catch (error) {
      logger.error('Critical error in sync queue processing:', error);
      setConnectionError('Sync processing failed');
    } finally {
      this._processing = false;
      setSyncing(false);
      setQueueSize(0);
    }
  }

  private async _processSync(sync: QueuedSync): Promise<void> {
    const { data } = sync;

    // Save to IndexedDB
    const database = await getDatabase();

    if (database) {
      await this._saveToIndexedDB(database, data);
    }
  }

  private async _saveToIndexedDB(database: IDBDatabase, data: ChatSyncData): Promise<void> {
    console.log('[SyncManager] _saveToIndexedDB called for:', data.id);
    logger.performance.start(`indexeddb-save-${data.id}`);

    try {
      // Validate data before saving
      if (!this._validateChatData(data)) {
        throw new Error('Invalid chat data during save operation');
      }

      // Use cached file state if not provided (Note: caching functionality removed from workbench)
      let fileState = data.fileState;

      if (!fileState) {
        // Generate file state from current files - simplified approach
        const currentFiles = workbenchStore.files.get();
        fileState = currentFiles
          ? Object.fromEntries(
              Object.entries(currentFiles)
                .map(([path, file]) => {
                  if (file && file.type === 'file' && file.content !== undefined) {
                    return [path, { content: file.content, isBinary: file.isBinary || false }];
                  }

                  return undefined;
                })
                .filter((entry): entry is [string, { content: string; isBinary: boolean }] => entry !== undefined),
            )
          : undefined;

        if (fileState) {
          logger.info(`Generated file state for chat ${data.id} with ${Object.keys(fileState).length} files`);
        } else {
          logger.warn(`No files found for chat ${data.id}`);
        }
      } else {
        logger.debug(`Using provided file state for chat ${data.id} with ${Object.keys(fileState).length} files`);
      }

      // Validate file state if present
      if (fileState) {
        const validFiles = Object.entries(fileState).filter(([path, fileData]) => {
          return (
            path &&
            typeof path === 'string' &&
            fileData &&
            typeof fileData === 'object' &&
            'content' in fileData &&
            typeof fileData.content === 'string'
          );
        });

        if (validFiles.length !== Object.keys(fileState).length) {
          logger.warn(`Filtered ${Object.keys(fileState).length - validFiles.length} invalid files from sync`);
          fileState = Object.fromEntries(validFiles);
        }
      }

      await setMessages(
        database,
        data.id,
        data.messages,
        data.urlId,
        data.description,
        data.model,
        undefined, // timestamp - will use current time
        'local',
        fileState,
      );

      console.log('[SyncManager] _saveToIndexedDB completed for:', data.id);
      logger.performance.end(`indexeddb-save-${data.id}`);
    } catch (error) {
      logger.error(`Failed to save chat ${data.id} to IndexedDB:`, error);
      throw error;
    }
  }

  // Supabase sync removed

  private async _loadFromIndexedDB(database: IDBDatabase, id: string): Promise<ChatSyncData | null> {
    try {
      const messages = await getMessages(database, id);

      if (!messages || messages.messages.length === 0) {
        logger.debug(`No messages found for chat ${id}`);
        return null;
      }

      // Validate the loaded data
      if (!messages.id || !Array.isArray(messages.messages)) {
        logger.warn(`Invalid data structure for chat ${id}`);
        return null;
      }

      const chatData: ChatSyncData = {
        id: messages.id,
        urlId: messages.urlId || messages.id,
        messages: messages.messages,
        description: messages.description,
        model: messages.model,
        fileState: messages.fileState,
        origin: messages.origin || 'local',
      };

      // Additional validation
      if (!this._validateChatData(chatData)) {
        logger.warn(`Chat data validation failed for ${id}`);
        return null;
      }

      return chatData;
    } catch (error) {
      logger.error('Failed to load from IndexedDB:', error);
      return null;
    }
  }

  // Supabase load removed

  private async _handleSyncError(sync: QueuedSync, error: Error): Promise<void> {
    sync.retries++;

    if (sync.retries < this._options.maxRetries) {
      const delay = this._options.retryDelay * Math.pow(2, sync.retries - 1);

      if (this._options.enableLogging) {
        logger.warn(`Retrying sync ${sync.id} in ${delay}ms (attempt ${sync.retries}/${this._options.maxRetries})`);
      }

      // Add back to queue with delay
      setTimeout(() => {
        this._queue.unshift(sync);
        this._updateQueueStatus();
        this._processQueue();
      }, delay);
    } else {
      logger.error(`Sync ${sync.id} failed after ${sync.retries} attempts:`, error);
      setConnectionError(`Sync failed: ${error.message}`);
      sync.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private _removeExistingSync(chatId: string): void {
    const existingIndex = this._queue.findIndex((sync) => sync.data.id === chatId);

    if (existingIndex !== -1) {
      const existing = this._queue.splice(existingIndex, 1)[0];
      existing.reject(new Error('Replaced by newer sync'));

      if (this._options.enableLogging) {
        logger.debug(`Removed existing sync for chat ${chatId}`);
      }
    }
  }

  private _generateSyncId(data: ChatSyncData): string {
    const lastMessage = data.messages[data.messages.length - 1];

    if (!lastMessage) {
      return `${data.id}-empty-${Date.now()}`;
    }

    const content = Array.isArray((lastMessage as any).parts)
      ? (lastMessage as any).parts
          .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')
          .substring(0, 30)
      : ((lastMessage as any).content ?? '').substring(0, 30);

    return `${data.id}-${lastMessage.role}-${content}-${Date.now()}`;
  }

  private _updateQueueStatus(): void {
    setQueueSize(this._queue.length);
  }

  /**
   * Validate chat data structure and content
   */
  private _validateChatData(data: ChatSyncData): boolean {
    if (!data) {
      return false;
    }

    // Check required fields
    if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
      return false;
    }

    if (!data.urlId || typeof data.urlId !== 'string' || data.urlId.trim() === '') {
      return false;
    }

    if (!Array.isArray(data.messages) || data.messages.length === 0) {
      return false;
    }

    // Validate message structure
    for (const message of data.messages) {
      if (!message || typeof message !== 'object') {
        return false;
      }

      if (!message.role || typeof message.role !== 'string') {
        return false;
      }
    }

    return true;
  }

  /**
   * Fallback method to find chat data by partial ID matches
   */
  private async _loadFromIndexedDBFallback(database: IDBDatabase, searchId: string): Promise<ChatSyncData | null> {
    try {
      const allChats = await getAll(database);

      // Try exact match first
      const exactMatch = allChats.find((chat) => chat.id === searchId || chat.urlId === searchId);

      if (exactMatch) {
        return this._convertToChatSyncData(exactMatch);
      }

      // Try partial match (for legacy data with different ID formats)
      const partialMatch = allChats.find(
        (chat) =>
          chat.id.includes(searchId) ||
          searchId.includes(chat.id) ||
          chat.urlId?.includes(searchId) ||
          searchId.includes(chat.urlId || ''),
      );

      if (partialMatch) {
        logger.info(`Found partial match for ${searchId}: ${partialMatch.id}`);
        return this._convertToChatSyncData(partialMatch);
      }

      return null;
    } catch (error) {
      logger.error('Error in fallback lookup:', error);
      return null;
    }
  }

  /**
   * Convert database chat entry to ChatSyncData format
   */
  private _convertToChatSyncData(dbEntry: any): ChatSyncData {
    return {
      id: dbEntry.id,
      urlId: dbEntry.urlId || dbEntry.id,
      messages: dbEntry.messages || [],
      description: dbEntry.description || 'Restored Chat',
      model: dbEntry.model,
      timestamp: dbEntry.timestamp,
      origin: dbEntry.origin || 'local',
      fileState: dbEntry.fileState,
    };
  }
}

// Initialize sync manager with automatic database repair
export const syncManager = new SyncManager({
  enableLogging: import.meta.env.DEV, // Only enable logging in development
  debounceMs: 1000,
  maxRetries: 3,
  timeout: 15000,
});

// Automatically repair database on startup (async, non-blocking)
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const database = await getDatabase();

      if (database) {
        const repairResult = await repairDatabase(database);

        if (repairResult.cleanedInvalid > 0 || repairResult.fixedInconsistent > 0) {
          logger.info(
            `Database auto-repair completed: ${repairResult.cleanedInvalid} invalid entries removed, ${repairResult.fixedInconsistent} entries fixed`,
          );
        }
      }
    } catch (error) {
      logger.warn('Auto database repair failed:', error);
    }
  }, 1000); // Delay to allow app to initialize
}

// Export convenience functions
export const syncChat = (data: ChatSyncData) => syncManager.syncChat(data);
export const loadChatHistory = (id: string) => syncManager.loadChatHistory(id);
export const cleanupSync = () => syncManager.cleanup();
