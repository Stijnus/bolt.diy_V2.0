import type { FileMap } from '~/lib/stores/files';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FileStateCache');

export interface CachedFileState {
  state: Record<string, { content: string; isBinary: boolean }> | undefined;
  lastUpdate: number;
  filesHash: string;
}

class FileStateCache {
  private cache = new Map<string, CachedFileState>();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Generate a hash of the file map to detect changes
   */
  private generateFilesHash(files: FileMap): string {
    const fileEntries = Object.entries(files)
      .filter(([_, file]) => file && file.type === 'file' && file.content !== undefined)
      .map(([path, file]) => {
        const fileObj = file as { type: 'file'; content: string; isBinary: boolean };
        return `${path}:${fileObj.content.length}:${fileObj.isBinary}`;
      })
      .sort()
      .join('|');

    // Simple hash function
    let hash = 0;

    for (let i = 0; i < fileEntries.length; i++) {
      const char = fileEntries.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Get cached file state if it's still valid
   */
  get(chatId: string, files: FileMap): CachedFileState | null {
    const cached = this.cache.get(chatId);

    if (!cached) {
      return null;
    }

    const now = Date.now();

    // Check if cache is expired
    if (now - cached.lastUpdate > this.CACHE_TTL) {
      this.cache.delete(chatId);
      logger.debug(`Cache expired for chat ${chatId}`);

      return null;
    }

    // Check if files have changed
    const currentFilesHash = this.generateFilesHash(files);

    if (cached.filesHash !== currentFilesHash) {
      this.cache.delete(chatId);
      logger.debug(`Files changed for chat ${chatId}, invalidating cache`);

      return null;
    }

    logger.debug(`Using cached file state for chat ${chatId}`);

    return cached;
  }

  /**
   * Set cached file state
   */
  set(chatId: string, files: FileMap, state: Record<string, { content: string; isBinary: boolean }> | undefined): void {
    // Clean up old entries if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const filesHash = this.generateFilesHash(files);

    this.cache.set(chatId, {
      state,
      lastUpdate: Date.now(),
      filesHash,
    });

    logger.debug(`Cached file state for chat ${chatId}`);
  }

  /**
   * Invalidate cache for a specific chat
   */
  invalidate(chatId: string): void {
    this.cache.delete(chatId);
    logger.debug(`Invalidated cache for chat ${chatId}`);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cleared all file state cache');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ chatId: string; age: number; size: number }> } {
    const now = Date.now();

    const entries = Array.from(this.cache.entries()).map(([chatId, cached]) => ({
      chatId,
      age: now - cached.lastUpdate,
      size: cached.state ? Object.keys(cached.state).length : 0,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Singleton instance
export const fileStateCache = new FileStateCache();

/**
 * Create file state from files map with caching
 */
export function createFileState(
  chatId: string,
  files: FileMap,
): Record<string, { content: string; isBinary: boolean }> | undefined {
  // Check cache first
  const cached = fileStateCache.get(chatId, files);

  if (cached) {
    return cached.state;
  }

  // Create new file state
  const fileState: Record<string, { content: string; isBinary: boolean }> | undefined = files
    ? Object.fromEntries(
        Object.entries(files)
          .map(([path, file]) => {
            if (file && file.type === 'file' && file.content !== undefined) {
              return [path, { content: file.content, isBinary: file.isBinary || false }];
            }

            return undefined;
          })
          .filter((entry): entry is [string, { content: string; isBinary: boolean }] => entry !== undefined),
      )
    : undefined;

  // Cache the result
  fileStateCache.set(chatId, files, fileState);

  return fileState;
}
