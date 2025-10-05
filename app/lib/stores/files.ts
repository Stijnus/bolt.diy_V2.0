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

    // initial snapshot
    await this.#refreshAllFiles();

    // watch for changes
    webcontainer.fs.watch(WORK_DIR, { recursive: true }, () => {
      // coalesce bursts of events
      clearTimeout((this as any)._watchTimeout);
      (this as any)._watchTimeout = setTimeout(() => {
        this.#refreshAllFiles().catch((e) => logger.error('Failed to refresh files', e));
      }, 100);
    });
  }

  async #refreshAllFiles() {
    const webcontainer = await this.#webcontainer;

    // export JSON tree
    const tree = await webcontainer.export(WORK_DIR, { format: 'json' as const });

    const newMap: FileMap = {};

    let size = 0;

    const walk = async (prefix: string, node: any) => {
      if (!node) {
        return;
      }

      const entries = Object.entries(node) as Array<[string, any]>;

      for (const [name, entry] of entries) {
        const fullPath = `${prefix}/${name}`.replace(/\\/g, '/');

        if (entry && typeof entry === 'object' && 'directory' in entry) {
          newMap[fullPath] = { type: 'folder' };
          await walk(fullPath, entry.directory);
        } else if (entry && typeof entry === 'object' && 'file' in entry) {
          const contentUint8 = entry.file.contents as Uint8Array;
          const isBinary = getEncoding(convertToBuffer(contentUint8), { chunkLength: 100 }) === 'binary';
          const content = !isBinary ? this.#decodeFileContent(contentUint8) : '';
          newMap[fullPath] = { type: 'file', content, isBinary };
          size++;
        }
      }
    };

    await walk(WORK_DIR, (tree as any).directory ?? {});

    this.files.set(newMap);
    this.#size = size;
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
