import { Buffer } from 'node:buffer';
import * as nodePath from 'node:path';
import type { WebContainer } from '@webcontainer/api';
import { getEncoding } from 'istextorbinary';
import { map, type MapStore } from 'nanostores';
import { WORK_DIR } from '~/utils/constants';
import { shouldExcludeFile } from '~/utils/constants/file-patterns';
import { computeFileModifications } from '~/utils/diff';
import { createScopedLogger } from '~/utils/logger';
import { batchRetryWithBackoff, retryOnErrorMessage } from '~/utils/retry';
import { unreachable } from '~/utils/unreachable';

const logger = createScopedLogger('FilesStore');

const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

/**
 * Result summary from file restoration
 */
export interface FileRestorationResult {
  /** Number of successfully restored files */
  successCount: number;
  /** Number of failed files */
  failedCount: number;
  /** Number of files that required retries */
  retriedCount: number;
  /** List of failed file paths with their errors */
  failures: Array<{ filePath: string; error: string }>;
}

export class FilesStore {
  #webcontainer: Promise<WebContainer>;

  /**
   * Tracks the number of files without folders.
   */
  #size = 0;

  /**
   * @note Keeps track all modified files with their original content since the last user message.
   * Needs to be reset when the user sends another message and all changes have to be submitted
   * for the model to be aware of the changes.
   */
  #modifiedFiles: Map<string, string> = import.meta.hot?.data.modifiedFiles ?? new Map();

  /**
   * Map of files that matches the state of WebContainer.
   */
  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  /**
   * Flag to prevent file watcher from interfering during file restoration
   */
  #isRestoring = false;

  get filesCount() {
    return this.#size;
  }

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;

    if (import.meta.hot) {
      import.meta.hot.data.files = this.files;
      import.meta.hot.data.modifiedFiles = this.#modifiedFiles;
    }

    this.#init();
  }

  getFile(filePath: string) {
    const dirent = this.files.get()[filePath];

    if (dirent?.type !== 'file') {
      return undefined;
    }

    return dirent;
  }

  getFileModifications() {
    return computeFileModifications(this.files.get(), this.#modifiedFiles);
  }

  resetFileModifications() {
    this.#modifiedFiles.clear();
  }

  async saveFile(filePath: string, content: string) {
    const webcontainer = await this.#webcontainer;

    try {
      const relativePath = nodePath.relative(webcontainer.workdir, filePath);

      if (!relativePath) {
        throw new Error(`EINVAL: invalid file path, write '${relativePath}'`);
      }

      const oldContent = this.getFile(filePath)?.content;

      if (!oldContent) {
        unreachable('Expected content to be defined');
      }

      await webcontainer.fs.writeFile(relativePath, content);

      if (!this.#modifiedFiles.has(filePath)) {
        this.#modifiedFiles.set(filePath, oldContent);
      }

      // we immediately update the file and don't rely on the `change` event coming from the watcher
      this.files.setKey(filePath, { type: 'file', content, isBinary: false });

      logger.info('File updated');
    } catch (error) {
      logger.error('Failed to update file content\n\n', error);

      throw error;
    }
  }

  async #init() {
    const webcontainer = await this.#webcontainer;

    logger.info(`Initializing file watcher for ${WORK_DIR}`);

    // initial snapshot
    await this.#refreshAllFiles();

    // watch for changes - use '.' for current workdir
    webcontainer.fs.watch('.', { recursive: true }, (event, filename) => {
      logger.debug(`File system change detected: ${event} ${filename || ''}`);

      // Skip refreshes during file restoration to prevent infinite loops
      if (this.#isRestoring) {
        logger.debug('Skipping file refresh during restoration');
        return;
      }

      // coalesce bursts of events
      clearTimeout((this as any)._watchTimeout);
      (this as any)._watchTimeout = setTimeout(() => {
        logger.debug('Refreshing all files...');
        this.#refreshAllFiles().catch((e) => logger.error('Failed to refresh files', e));
      }, 100);
    });

    logger.info('File watcher initialized successfully');
  }

  async #refreshAllFiles() {
    const webcontainer = await this.#webcontainer;

    try {
      // export JSON tree - use '.' for current workdir
      logger.debug('Exporting file tree from WebContainer...');

      const tree = await webcontainer.export('.', { format: 'json' as const });

      const newMap: FileMap = {};

      let size = 0;

      const walk = async (prefix: string, node: any) => {
        if (!node) {
          logger.debug(`Walk: node is null/undefined for prefix ${prefix}`);
          return;
        }

        const entries = Object.entries(node) as Array<[string, any]>;
        logger.debug(`Walk: processing ${entries.length} entries at ${prefix}`);

        for (const [name, entry] of entries) {
          const fullPath = `${prefix}/${name}`.replace(/\\/g, '/');

          if (entry && typeof entry === 'object' && 'directory' in entry) {
            logger.debug(`Found folder: ${fullPath}`);
            newMap[fullPath] = { type: 'folder' };
            await walk(fullPath, entry.directory);
          } else if (entry && typeof entry === 'object' && 'file' in entry) {
            const fileEntry = entry.file as { contents?: string | Uint8Array; symlink?: string };

            if ('symlink' in fileEntry && typeof fileEntry.symlink === 'string') {
              logger.debug(`Skipping symlink: ${fullPath} -> ${fileEntry.symlink}`);
              continue;
            }

            const contents = fileEntry.contents;

            if (typeof contents === 'string') {
              logger.debug(`Found file: ${fullPath} (text)`);
              newMap[fullPath] = { type: 'file', content: contents, isBinary: false };
              size++;
              continue;
            }

            if (contents instanceof Uint8Array) {
              const isBinary = getEncoding(convertToBuffer(contents), { chunkLength: 100 }) === 'binary';
              const content = !isBinary ? this.#decodeFileContent(contents) : '';
              logger.debug(`Found file: ${fullPath} (${isBinary ? 'binary' : 'text'})`);
              newMap[fullPath] = { type: 'file', content, isBinary };
              size++;
              continue;
            }

            logger.warn(`File entry without readable contents skipped: ${fullPath}`);
          }
        }
      };

      // when exporting '.', tree IS the directory content, not tree.directory
      const rootContent = (tree as any).directory || tree;
      logger.debug('Root content type:', typeof rootContent, 'keys:', Object.keys(rootContent || {}));

      await walk(WORK_DIR, rootContent);

      logger.debug(`Setting ${size} files to store, map keys:`, Object.keys(newMap));
      this.files.set(newMap);
      this.#size = size;

      logger.info(`Refreshed ${size} files`);
    } catch (error) {
      logger.error('Error refreshing files:', error);
    }
  }

  /**
   * Checks if a file should be hidden from chat history restoration
   */
  #shouldHideFile(filePath: string): boolean {
    return shouldExcludeFile(filePath);
  }

  /**
   * Progress callback for file restoration
   */
  #onRestoreProgress?: (current: number, total: number, fileName?: string) => void;

  /**
   * Restores files to WebContainer from a FileMap with enhanced error handling and retry logic
   * Used when loading chat history to restore project state
   *
   * @param fileMap - Map of files to restore
   * @param onProgress - Optional callback for progress updates (current, total, fileName)
   * @returns Detailed restoration result summary
   */
  async restoreFiles(
    fileMap: FileMap,
    onProgress?: (current: number, total: number, fileName?: string) => void,
  ): Promise<FileRestorationResult> {
    this.#onRestoreProgress = onProgress;
    const webcontainer = await this.#webcontainer;
    const filesToRestore = Object.entries(fileMap).filter(([, file]) => file?.type === 'file');

    if (filesToRestore.length === 0) {
      logger.debug('No files to restore');
      return { successCount: 0, failedCount: 0, retriedCount: 0, failures: [] };
    }

    // Filter out unwanted files (node_modules, build artifacts, etc.)
    const filteredFiles = filesToRestore.filter(([filePath]) => !this.#shouldHideFile(filePath));
    const excludedCount = filesToRestore.length - filteredFiles.length;

    if (excludedCount > 0) {
      logger.info(`Excluding ${excludedCount} files from restoration (node_modules, build artifacts, etc.)`);
    }

    if (filteredFiles.length === 0) {
      logger.debug('No valid files to restore after filtering');
      return { successCount: 0, failedCount: 0, retriedCount: 0, failures: [] };
    }

    logger.info(`Restoring ${filteredFiles.length} files to WebContainer with retry logic`);

    // Prevent file watcher from interfering during restoration
    this.#isRestoring = true;

    try {
      // Create retry operations for each file
      const fileOperations = filteredFiles.map(([filePath, file]) => {
        return async () => {
          // Validate file data upfront
          if (!file || file.type !== 'file') {
            throw new Error('Invalid file data');
          }

          // Validate file path and content
          if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
            throw new Error('Invalid file path');
          }

          if (typeof file.content !== 'string') {
            throw new Error('Invalid file content');
          }

          const relativePath = nodePath.relative(webcontainer.workdir, filePath);

          if (!relativePath || relativePath.startsWith('..')) {
            throw new Error(`Invalid relative path: ${relativePath}`);
          }

          // Ensure parent directories exist
          const parentDir = nodePath.dirname(relativePath);

          if (parentDir && parentDir !== '.') {
            try {
              await webcontainer.fs.mkdir(parentDir, { recursive: true });
            } catch (mkdirError) {
              // Directory might already exist, continue
              logger.debug(`Directory creation skipped for ${parentDir}:`, mkdirError);
            }
          }

          // Write the file
          await webcontainer.fs.writeFile(relativePath, file.content);
          logger.debug(`Restored file: ${relativePath}`);

          return { filePath, relativePath };
        };
      });

      // Execute file operations with retry logic and batching
      const results = await batchRetryWithBackoff(fileOperations, {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 5000,
        batchSize: 10, // Process 10 files at a time to avoid overwhelming WebContainer
        shouldRetry: retryOnErrorMessage([
          'EBUSY', // Resource busy
          'EAGAIN', // Try again
          'ENOENT', // No such file or directory (parent dir might not exist yet)
          'EMFILE', // Too many open files
          'timeout', // Timeout errors
        ]),
        onRetry: (error, attempt, delay) => {
          logger.warn(`Retrying file restoration (attempt ${attempt + 1}) after ${delay}ms: ${error}`);
        },
      });

      // Collect successful and failed results with progress tracking
      const successful: Array<{ filePath: string; relativePath: string; attempts: number }> = [];
      const failed: Array<{ filePath: string; error: unknown; attempts: number }> = [];
      let processedCount = 0;

      results.forEach((result, index) => {
        const [filePath] = filteredFiles[index];

        if (result.success && result.data) {
          successful.push({
            filePath,
            relativePath: result.data.relativePath,
            attempts: result.attempts,
          });
          processedCount++;

          // Report progress after each successful file
          if (this.#onRestoreProgress) {
            const fileName = nodePath.basename(filePath);
            this.#onRestoreProgress(processedCount, filteredFiles.length, fileName);
          }
        } else {
          failed.push({
            filePath,
            error: result.error,
            attempts: result.attempts,
          });
        }
      });

      // Calculate restoration statistics
      const retriedCount = successful.filter((r) => r.attempts > 1).length;
      const failures = failed.map((f) => ({
        filePath: f.filePath,
        error: f.error instanceof Error ? f.error.message : String(f.error),
      }));

      if (successful.length > 0) {
        logger.info(
          `Successfully restored ${successful.length} files${retriedCount > 0 ? ` (${retriedCount} required retries)` : ''}, refreshing file tree...`,
        );

        // Refresh ALL files from WebContainer to get the complete, accurate state
        await this.#refreshAllFiles();

        logger.info(`File tree refreshed after restoration`);

        // Optional: Verify a sample of restored files to ensure integrity
        if (successful.length > 0) {
          const sampleSize = Math.min(3, successful.length);
          const samplesToVerify = successful.slice(0, sampleSize);
          let verificationIssues = 0;

          for (const { relativePath } of samplesToVerify) {
            try {
              const verifyContent = await webcontainer.fs.readFile(relativePath, 'utf-8');
              if (!verifyContent || verifyContent.length === 0) {
                logger.warn(`Verification failed: ${relativePath} is empty after restoration`);
                verificationIssues++;
              } else {
                logger.debug(`Verification passed: ${relativePath}`);
              }
            } catch (verifyError) {
              logger.warn(`Verification failed for ${relativePath}:`, verifyError);
              verificationIssues++;
            }
          }

          if (verificationIssues > 0) {
            logger.warn(
              `${verificationIssues}/${sampleSize} sample files failed verification - some files may not have been written correctly`,
            );
          } else {
            logger.info(`All ${sampleSize} sample files verified successfully`);
          }
        }
      }

      if (failed.length > 0) {
        logger.warn(`Failed to restore ${failed.length} files after retries`);
        failed.forEach((result) => {
          logger.error(`Failed: ${result.filePath} after ${result.attempts} attempts - ${result.error}`);
        });
      }

      // Return restoration summary
      const result: FileRestorationResult = {
        successCount: successful.length,
        failedCount: failed.length,
        retriedCount,
        failures,
      };

      // If all files failed to restore, throw an error with the result attached
      if (successful.length === 0 && failed.length > 0) {
        const error = new Error(
          `Failed to restore all ${failed.length} files. First error: ${failures[0]?.error || 'Unknown error'}`,
        ) as Error & { result?: FileRestorationResult };
        error.result = result;
        throw error;
      }

      return result;
    } catch (error) {
      logger.error('Error restoring files:', error);

      // If the error already has restoration result data, rethrow it
      if ((error as any).result) {
        throw error;
      }

      // Otherwise, create a new error with empty result
      const wrappedError = new Error(
        error instanceof Error ? error.message : String(error),
      ) as Error & { result?: FileRestorationResult };
      wrappedError.result = {
        successCount: 0,
        failedCount: filteredFiles.length,
        retriedCount: 0,
        failures: [{ filePath: 'unknown', error: wrappedError.message }],
      };
      throw wrappedError;
    } finally {
      // Always clear the flag and progress callback, even if restoration fails
      this.#isRestoring = false;
      this.#onRestoreProgress = undefined;
      logger.debug('File restoration completed, watcher re-enabled');
    }
  }

  #decodeFileContent(buffer?: Uint8Array) {
    if (!buffer || buffer.byteLength === 0) {
      return '';
    }

    try {
      return utf8TextDecoder.decode(buffer);
    } catch (error) {
      console.log(error);
      return '';
    }
  }
}

/**
 * Converts a `Uint8Array` into a Node.js `Buffer` by copying the prototype.
 * The goal is to avoid expensive copies. It does create a new typed array
 * but that's generally cheap as long as it uses the same underlying
 * array buffer.
 */
function convertToBuffer(view: Uint8Array): Buffer {
  const buffer = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);

  Object.setPrototypeOf(buffer, Buffer.prototype);

  return buffer as Buffer;
}
