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
