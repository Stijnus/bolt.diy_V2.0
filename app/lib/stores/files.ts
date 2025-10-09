import { Buffer } from 'node:buffer';
import * as nodePath from 'node:path';
import type { WebContainer } from '@webcontainer/api';
import { getEncoding } from 'istextorbinary';
import { map, type MapStore } from 'nanostores';
import { WORK_DIR } from '~/utils/constants';
import { computeFileModifications } from '~/utils/diff';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const logger = createScopedLogger('FilesStore');

const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });

// Files and directories to exclude from chat history restoration
const DEFAULT_HIDDEN_PATTERNS = [
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
    return DEFAULT_HIDDEN_PATTERNS.some((pattern) => pattern.test(filePath));
  }

  /**
   * Restores files to WebContainer from a FileMap with enhanced error handling
   * Used when loading chat history to restore project state
   */
  async restoreFiles(fileMap: FileMap): Promise<void> {
    const webcontainer = await this.#webcontainer;
    const filesToRestore = Object.entries(fileMap).filter(([, file]) => file?.type === 'file');

    if (filesToRestore.length === 0) {
      logger.debug('No files to restore');
      return;
    }

    // Filter out unwanted files (node_modules, build artifacts, etc.)
    const filteredFiles = filesToRestore.filter(([filePath]) => !this.#shouldHideFile(filePath));
    const excludedCount = filesToRestore.length - filteredFiles.length;

    if (excludedCount > 0) {
      logger.info(`Excluding ${excludedCount} files from restoration (node_modules, build artifacts, etc.)`);
    }

    if (filteredFiles.length === 0) {
      logger.debug('No valid files to restore after filtering');
      return;
    }

    logger.info(`Restoring ${filteredFiles.length} files to WebContainer`);

    // Prevent file watcher from interfering during restoration
    this.#isRestoring = true;

    try {
      const results = await Promise.allSettled(
        filteredFiles.map(async ([filePath, file]) => {
          if (!file || file.type !== 'file') {
            return { success: false, filePath, error: 'Invalid file data' };
          }

          try {
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

            return { success: true, filePath, relativePath };
          } catch (error) {
            logger.error(`Failed to restore file ${filePath}:`, error);
            return { success: false, filePath, error };
          }
        }),
      );

      // Count successful and failed restorations
      const successful = results.filter((result) => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter((result) => result.status === 'fulfilled' && !result.value.success);

      if (successful.length > 0) {
        logger.info(`Successfully restored ${successful.length} files, refreshing file tree...`);

        // Instead of manually updating the store with only restored files,
        // refresh ALL files from WebContainer to get the complete, accurate state
        await this.#refreshAllFiles();

        logger.info(`File tree refreshed after restoration`);
      }

      if (failed.length > 0) {
        logger.warn(`Failed to restore ${failed.length} files`);
        failed.forEach((result) => {
          if (result.status === 'fulfilled') {
            logger.debug(`Failed: ${result.value.filePath} - ${result.value.error}`);
          }
        });
      }

      // If all files failed to restore, throw an error
      if (successful.length === 0 && failed.length > 0) {
        throw new Error(`Failed to restore all ${failed.length} files`);
      }
    } catch (error) {
      logger.error('Error restoring files:', error);
      throw error;
    } finally {
      // Always clear the flag, even if restoration fails
      this.#isRestoring = false;
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
