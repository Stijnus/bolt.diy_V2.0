import { atom, map, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import { EditorStore } from './editor';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import { loadWorkspaceState, saveWorkspaceState } from '~/lib/persistence/db';
import { ActionRunner } from '~/lib/runtime/action-runner';
import type { ActionCallbackData, ArtifactCallbackData } from '~/lib/runtime/message-parser';
import { webcontainer } from '~/lib/webcontainer';
import type { ITerminal } from '~/types/terminal';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WorkbenchStore');

export interface ArtifactState {
  id: string;
  title: string;
  closed: boolean;
  runner: ActionRunner;
}

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;

type Artifacts = MapStore<Record<string, ArtifactState>>;

export type WorkbenchViewType = 'code' | 'preview';

export class WorkbenchStore {
  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);
  #persistenceReady = false;
  #persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  #filesStoreUnsubscribe: (() => void) | null = null;

  artifacts: Artifacts = import.meta.hot?.data.artifacts ?? map({});

  showWorkbench: WritableAtom<boolean> = import.meta.hot?.data.showWorkbench ?? atom(false);
  currentView: WritableAtom<WorkbenchViewType> = import.meta.hot?.data.currentView ?? atom('code');
  unsavedFiles: WritableAtom<Set<string>> = import.meta.hot?.data.unsavedFiles ?? atom(new Set<string>());
  devServerRunning: WritableAtom<boolean> = import.meta.hot?.data.devServerRunning ?? atom(false);
  restartCommand: WritableAtom<string> = import.meta.hot?.data.restartCommand ?? atom('npm run dev');
  currentProjectId: WritableAtom<string | null> = import.meta.hot?.data.currentProjectId ?? atom<string | null>(null);
  modifiedFiles = new Set<string>();
  artifactIdList: string[] = [];

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.artifacts = this.artifacts;
      import.meta.hot.data.unsavedFiles = this.unsavedFiles;
      import.meta.hot.data.showWorkbench = this.showWorkbench;
      import.meta.hot.data.currentView = this.currentView;
      import.meta.hot.data.devServerRunning = this.devServerRunning;
      import.meta.hot.data.restartCommand = this.restartCommand;
      import.meta.hot.data.currentProjectId = this.currentProjectId;
    }

    if (typeof window !== 'undefined') {
      this.#filesStoreUnsubscribe = this.#filesStore.files.subscribe(() => {
        if (!this.#persistenceReady) {
          return;
        }

        this.#scheduleWorkspacePersist();
      });

      void this.#restoreWorkspaceState();
    } else {
      this.#persistenceReady = true;
    }

    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        this.#filesStoreUnsubscribe?.();
        this.#filesStoreUnsubscribe = null;
      });
    }
  }

  get previews() {
    return this.#previewsStore.previews;
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.#getArtifact(this.artifactIdList[0]);
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  getDevServerRunning(): boolean {
    return this.devServerRunning.get();
  }

  setDevServerRunning(value: boolean) {
    this.devServerRunning.set(value);
  }

  getRestartCommand(): string {
    return this.restartCommand.get();
  }

  setRestartCommand(cmd: string) {
    this.restartCommand.set(cmd);
  }

  setProjectContext(projectId: string | null) {
    this.currentProjectId.set(projectId);
  }

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);

    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      // we find the first file and select it
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  /**
   * Restores files to WebContainer from a FileMap
   * Used when loading chat history to restore project state
   */
  async restoreFiles(fileMap: FileMap): Promise<void> {
    await this.#filesStore.restoreFiles(fileMap);
  }

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;

    this.#editorStore.updateScrollPosition(filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    await this.#filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);

    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  resetCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    const { filePath } = currentDocument;
    const file = this.#filesStore.getFile(filePath);

    if (!file) {
      return;
    }

    this.setCurrentDocumentContent(file.content);
  }

  async saveAllFiles() {
    for (const filePath of this.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  async createFile(filePath: string, content = '') {
    await this.#filesStore.createFile(filePath, content);
    this.setDocuments(this.#filesStore.files.get());
  }

  async createFolder(folderPath: string) {
    await this.#filesStore.createFolder(folderPath);
    this.setDocuments(this.#filesStore.files.get());
  }

  async renamePath(oldPath: string, newPath: string) {
    await this.#filesStore.renamePath(oldPath, newPath);
    this.setDocuments(this.#filesStore.files.get());
  }

  async deletePath(path: string) {
    await this.#filesStore.deletePath(path);
    this.setDocuments(this.#filesStore.files.get());
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  // Alias with correct spelling (preferred going forward)
  getFileModifications() {
    return this.#filesStore.getFileModifications();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  abortAllActions() {
    // TODO: what do we wanna do and how do we wanna recover from this?
  }

  addArtifact({ messageId, title, id }: ArtifactCallbackData) {
    const artifact = this.#getArtifact(messageId);

    if (artifact) {
      return;
    }

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      runner: new ActionRunner(webcontainer),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }

  async addAction(data: ActionCallbackData) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      logger.warn('addAction skipped: Artifact not found', { messageId });
      return;
    }

    artifact.runner.addAction(data);
  }

  async runAction(data: ActionCallbackData) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      logger.warn('runAction skipped: Artifact not found', { messageId, action: data.action });
      return;
    }

    artifact.runner.runAction(data);
  }

  #scheduleWorkspacePersist() {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.#persistenceTimer) {
      clearTimeout(this.#persistenceTimer);
    }

    this.#persistenceTimer = setTimeout(() => {
      this.#persistenceTimer = null;

      saveWorkspaceState(this.#filesStore.files.get()).catch((error) => {
        logger.error('Failed to persist workspace state', error);
      });
    }, 500);
  }

  async #restoreWorkspaceState() {
    if (typeof window === 'undefined') {
      this.#persistenceReady = true;
      return;
    }

    try {
      const saved = await loadWorkspaceState();

      if (saved && Object.keys(saved).length > 0) {
        logger.info('Restoring workspace from saved state');
        await this.#filesStore.restoreFiles(saved);
        this.setDocuments(this.#filesStore.files.get());
      }
    } catch (error) {
      logger.error('Failed to restore workspace state', error);
    } finally {
      this.#persistenceReady = true;
      this.#scheduleWorkspacePersist();
    }
  }

  #getArtifact(id: string) {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }
}

export const workbenchStore = new WorkbenchStore();
