import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { FolderTree, Save, History, Terminal as TerminalIcon, Power, RefreshCcw, ChevronDown } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { toast } from 'react-toastify';
import { FileBreadcrumb } from './FileBreadcrumb';
import { FileTree } from './FileTree';
import { Terminal, type TerminalRef } from './terminal/Terminal';
import {
  CodeMirrorEditor,
  type EditorDocument,
  type OnChangeCallback as OnEditorChange,
  type OnSaveCallback as OnEditorSave,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { Checkbox } from '~/components/ui/Checkbox';
import { DialogRoot, Dialog, DialogTitle, DialogDescription, DialogButton } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { Input } from '~/components/ui/Input';
import { PanelHeader } from '~/components/ui/PanelHeader';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';

import { useAuth } from '~/lib/contexts/AuthContext';
import { shortcutEventEmitter } from '~/lib/hooks';
import {
  buildFileStateFromEntries,
  summarizeEntries,
  type EntrySpec,
  scanFileListForPreview,
  persistImportedProject,
  type ImportPreview,
} from '~/lib/persistence';
import { getBoltTerminalBuffer, subscribeBoltTerminal, clearBoltTerminal } from '~/lib/runtime/bolt-terminal-bus';
import { killDevServer, restartDevServer } from '~/lib/runtime/ui-runner';
import type { FileMap } from '~/lib/stores/files';
import { settingsStore } from '~/lib/stores/settings';
import { themeStore } from '~/lib/stores/theme';
import { workbenchStore } from '~/lib/stores/workbench';

import { classNames } from '~/utils/classNames';
import { WORK_DIR } from '~/utils/constants';
import { renderLogger } from '~/utils/logger';
import { isMobile } from '~/utils/mobile';

interface EditorPanelProps {
  files?: FileMap;
  unsavedFiles?: Set<string>;
  editorDocument?: EditorDocument;
  selectedFile?: string | undefined;
  isStreaming?: boolean;
  onEditorChange?: OnEditorChange;
  onEditorScroll?: OnEditorScroll;
  onFileSelect?: (value?: string) => void;
  onFileSave?: OnEditorSave;
  onFileReset?: () => void;
}

const DEFAULT_TERMINAL_SIZE = 25;
const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

export const EditorPanel = memo(
  ({
    files,
    unsavedFiles,
    editorDocument,
    selectedFile,
    isStreaming,
    onFileSelect,
    onEditorChange,
    onEditorScroll,
    onFileSave,
    onFileReset,
  }: EditorPanelProps) => {
    renderLogger.trace('EditorPanel');

    const theme = useStore(themeStore);
    const settings = useStore(settingsStore);
    const showTerminal = useStore(workbenchStore.showTerminal);

    const navigate = useNavigate();
    const { user } = useAuth();

    const [isDragging, setIsDragging] = useState(false);

    const [importPreviewState, setImportPreviewState] = useState<{
      preview: ImportPreview;
      fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
    } | null>(null);

    const [importOptions, setImportOptions] = useState<{
      title: string;
      includeTopFiles: boolean;
      selected: Record<string, boolean>;
      runInstall: boolean;
      startDevServer: boolean;
    }>({ title: '', includeTopFiles: true, selected: {}, runInstall: true, startDevServer: true });

    useEffect(() => {
      if (importPreviewState) {
        const selected: Record<string, boolean> = {};
        const sizes = importPreviewState.preview.folderStats || [];
        importPreviewState.preview.topLevelFolders.forEach((f) => {
          const stat = sizes.find((s) => s.name === f);
          const bytes = stat?.bytes || 0;
          selected[f] = bytes < 50 * 1024 * 1024; // pre-unselect very large folders (50MB)
        });

        const hasPkg = Object.keys(importPreviewState.fileState || {}).some(
          (p) => p.endsWith('/package.json') || p === '/package.json' || p.endsWith('package.json'),
        );
        setImportOptions({
          title: importPreviewState.preview.rootName || 'Imported Project',
          includeTopFiles: true,
          selected,
          runInstall: hasPkg,
          startDevServer: hasPkg,
        });
      }
    }, [importPreviewState]);

    const terminalRefs = useRef<Array<TerminalRef | null>>([]);
    const terminalPanelRef = useRef<ImperativePanelHandle>(null);
    const terminalToggledByShortcut = useRef(false);

    // Memoized ref callbacks per index to avoid ref churn causing repeated updates
    const terminalRefCallbacks = useRef<Array<((ref: TerminalRef | null) => void) | undefined>>([]);

    const getTerminalRefCallback = useCallback((i: number) => {
      if (!terminalRefCallbacks.current[i]) {
        terminalRefCallbacks.current[i] = (ref: TerminalRef | null) => {
          terminalRefs.current[i] = ref;
        };
      }

      return terminalRefCallbacks.current[i]!;
    }, []);

    // 0 = Bolt Terminal (readonly); 1..N = interactive terminals
    const [activeTerminal, setActiveTerminal] = useState(0);
    const terminalCount = 1;

    // Bolt Terminal wiring
    const boltXtermRef = useRef<import('@xterm/xterm').Terminal | null>(null);
    const boltUnsubRef = useRef<(() => void) | null>(null);

    const activeFileSegments = useMemo(() => {
      if (!editorDocument) {
        return undefined;
      }

      return editorDocument.filePath.split('/');
    }, [editorDocument]);

    const activeFileUnsaved = useMemo(() => {
      return editorDocument !== undefined && unsavedFiles?.has(editorDocument.filePath);
    }, [editorDocument, unsavedFiles]);

    useEffect(() => {
      const unsubscribeFromEventEmitter = shortcutEventEmitter.on('toggleTerminal', () => {
        terminalToggledByShortcut.current = true;
      });

      const unsubscribeFromThemeStore = themeStore.subscribe(() => {
        for (const ref of Object.values(terminalRefs.current)) {
          ref?.reloadStyles();
        }
      });

      return () => {
        boltUnsubRef.current?.();
        boltUnsubRef.current = null;
        unsubscribeFromEventEmitter();
        unsubscribeFromThemeStore();
      };
    }, []);

    useEffect(() => {
      const { current: terminal } = terminalPanelRef;

      if (!terminal) {
        return;
      }

      const isCollapsed = terminal.isCollapsed();

      if (!showTerminal && !isCollapsed) {
        terminal.collapse();
      } else if (showTerminal && isCollapsed) {
        terminal.resize(DEFAULT_TERMINAL_SIZE);
      }

      terminalToggledByShortcut.current = false;
    }, [showTerminal]);

    // Keep internal ref arrays bounded to the number of terminals

    return (
      <PanelGroup direction="vertical">
        <Panel defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={10} collapsible>
              <div className="flex flex-col border-r border-bolt-elements-borderColor h-full">
                <PanelHeader>
                  <FolderTree className="w-4 h-4 shrink-0" />
                  Files
                </PanelHeader>
                <div className="flex-1 overflow-hidden">
                  <FileTree
                    files={files}
                    hideRoot
                    unsavedFiles={unsavedFiles}
                    rootFolder={WORK_DIR}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                  />
                </div>
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel className="flex flex-col" defaultSize={80} minSize={20}>
              <PanelHeader className="overflow-x-auto">
                {activeFileSegments?.length && (
                  <div className="flex items-center flex-1 text-sm">
                    <FileBreadcrumb pathSegments={activeFileSegments} files={files} onFileSelect={onFileSelect} />
                    {activeFileUnsaved && (
                      <div className="flex gap-1 ml-auto -mr-1.5">
                        <PanelHeaderButton onClick={onFileSave}>
                          <Save className="w-4 h-4" />
                          Save
                        </PanelHeaderButton>
                        <PanelHeaderButton onClick={onFileReset}>
                          <History className="w-4 h-4" />
                          Reset
                        </PanelHeaderButton>
                      </div>
                    )}
                  </div>
                )}
              </PanelHeader>
              <div
                className="h-full flex-1 overflow-hidden relative"
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDragLeave={(e) => {
                  if ((e.target as HTMLElement).classList.contains('drop-overlay')) {
                    setIsDragging(false);
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);

                  try {
                    const dt = e.dataTransfer;

                    if (!dt) {
                      return;
                    }

                    // Prefer DataTransferItem API with webkitGetAsEntry for folder drops
                    const items = dt.items;

                    if (items && items.length && 'webkitGetAsEntry' in items[0]) {
                      const allEntries: EntrySpec[] = [];

                      const walkEntry = async (entry: any, prefix: string) => {
                        if (entry.isDirectory) {
                          const reader = entry.createReader();

                          const batch: any[] = await new Promise((resolve, reject) =>
                            reader.readEntries(resolve, reject),
                          );

                          for (const child of batch) {
                            await walkEntry(child, prefix ? `${prefix}/${entry.name}` : entry.name);
                          }
                        } else if (entry.isFile) {
                          const file: File = await new Promise((resolve) => entry.file(resolve));
                          const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                          allEntries.push({ file, relPath });
                        }
                      };

                      for (let i = 0; i < items.length; i++) {
                        const it = items[i] as any;
                        const entry = it.webkitGetAsEntry?.();

                        if (entry) {
                          await walkEntry(entry, '');
                        }
                      }

                      if (allEntries.length) {
                        const { fileState, sizeMap } = await buildFileStateFromEntries(allEntries);
                        const rootName = allEntries[0]?.relPath?.split('/')?.[0];
                        const { preview } = summarizeEntries(fileState, rootName, sizeMap);
                        setImportPreviewState({ preview, fileState });

                        return;
                      }
                    }

                    // Fallback to FileList scan
                    const files = dt.files;

                    if (files && files.length) {
                      const { fileState, preview } = await scanFileListForPreview(files);
                      setImportPreviewState({ preview, fileState });
                    }
                  } catch (err: any) {
                    toast.error(err?.message || 'Drop import failed');
                  }
                }}
              >
                <CodeMirrorEditor
                  theme={theme}
                  editable={!isStreaming && editorDocument !== undefined}
                  settings={{
                    fontSize: `${settings.editor.fontSize}px`,
                    tabSize: settings.editor.tabSize,
                    lineHeight: settings.editor.lineHeight,
                    wordWrap: settings.editor.wordWrap,
                    minimap: settings.editor.minimap,
                    lineNumbers: settings.editor.lineNumbers,
                  }}
                  doc={editorDocument}
                  autoFocusOnDocumentChange={!isMobile()}
                  onScroll={onEditorScroll}
                  onChange={onEditorChange}
                  onSave={onFileSave}
                />

                {isDragging && (
                  <div className="drop-overlay absolute inset-0 z-10 flex items-center justify-center bg-bolt-elements-background-depth-2/80 border-2 border-dashed border-bolt-elements-borderColor text-bolt-elements-textSecondary">
                    <div className="text-center">
                      <div className="text-lg font-medium text-bolt-elements-textPrimary">Drop folder to import</div>
                      <div className="text-xs mt-1">We9ll scan files and show a preview</div>
                    </div>
                  </div>
                )}

                {/* Import Preview Dialog for drag-drop */}
                <DialogRoot open={!!importPreviewState}>
                  <Dialog onBackdrop={() => setImportPreviewState(null)} onClose={() => setImportPreviewState(null)}>
                    {importPreviewState ? (
                      <>
                        <DialogTitle>Import Preview</DialogTitle>
                        <DialogDescription className="px-5 py-4 text-sm">
                          <div className="space-y-4">
                            {/* Project name */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-bolt-elements-textSecondary">
                                Project name
                              </label>
                              <Input
                                value={importOptions.title}
                                onChange={(e) => setImportOptions((o) => ({ ...o, title: e.target.value }))}
                                placeholder={importPreviewState.preview.rootName || 'Imported Project'}
                              />
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center">
                                <div className="text-xs text-bolt-elements-textSecondary">Total files</div>
                                <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                                  {importPreviewState.preview.totalFiles}
                                </div>
                              </div>
                              <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center">
                                <div className="text-xs text-bolt-elements-textSecondary">Text files</div>
                                <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                                  {importPreviewState.preview.textFiles}
                                </div>
                              </div>
                              <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center">
                                <div className="text-xs text-bolt-elements-textSecondary">Binary files</div>
                                <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                                  {importPreviewState.preview.binaryFiles}
                                </div>
                              </div>
                              <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center">
                                <div className="text-xs text-bolt-elements-textSecondary">Top-level files</div>
                                <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                                  {importPreviewState.preview.topLevelFiles}
                                </div>
                              </div>
                            </div>

                            {/* Large folders warning */}
                            {(() => {
                              const stats = importPreviewState.preview.folderStats || [];
                              const large = stats.filter((s) => s.bytes > 10 * 1024 * 1024).map((s) => s.name);

                              if (!large.length) {
                                return null;
                              }

                              return (
                                <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-600">
                                  \u26a0 Some folders are large and may slow down import: {large.join(', ')}
                                </div>
                              );
                            })()}

                            {/* Detected framework and commands */}
                            {importPreviewState.preview.detected && (
                              <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                                <div className="text-xs text-bolt-elements-textSecondary">Detected</div>
                                <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                                  {importPreviewState.preview.detected.framework || 'JavaScript project'}
                                  {importPreviewState.preview.detected.packageManager
                                    ? ` \u2022 ${importPreviewState.preview.detected.packageManager}`
                                    : ''}
                                </div>
                                <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-bolt-elements-textSecondary sm:grid-cols-2">
                                  <div>
                                    Install: <code>{importPreviewState.preview.detected.installCmd}</code>
                                  </div>
                                  <div>
                                    Dev: <code>{importPreviewState.preview.detected.devCmd}</code>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Folder selection */}
                            {importPreviewState.preview.topLevelFolders.length > 0 && (
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-medium text-bolt-elements-textSecondary">
                                    Include folders
                                  </p>
                                  <label className="flex items-center gap-2 text-xs">
                                    <Checkbox
                                      checked={importOptions.includeTopFiles}
                                      onCheckedChange={(v) =>
                                        setImportOptions((o) => ({ ...o, includeTopFiles: Boolean(v) }))
                                      }
                                    />
                                    Include top-level files
                                  </label>
                                </div>
                                <div className="flex max-h-36 flex-wrap gap-2 overflow-auto rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-2">
                                  {importPreviewState.preview.topLevelFolders.map((f) => {
                                    const checked = importOptions.selected[f] ?? true;

                                    const stat = (importPreviewState.preview.folderStats || []).find(
                                      (s) => s.name === f,
                                    );

                                    const isLarge = (stat?.bytes || 0) > 10 * 1024 * 1024;

                                    return (
                                      <button
                                        key={f}
                                        type="button"
                                        onClick={() =>
                                          setImportOptions((o) => ({
                                            ...o,
                                            selected: { ...o.selected, [f]: !checked },
                                          }))
                                        }
                                        className={`select-none rounded-full px-3 py-1 text-xs transition-colors border ${
                                          checked
                                            ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text border-transparent'
                                            : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary border-bolt-elements-borderColor'
                                        } ${isLarge ? 'ring-1 ring-yellow-500/40' : ''}`}
                                        title={`${f}${stat ? ` (${(stat.bytes / 1024 / 1024).toFixed(1)} MB)` : ''}`}
                                      >
                                        {f}
                                        {stat ? (
                                          <span className="ml-1 opacity-70">{`(${(stat.bytes / 1024 / 1024).toFixed(1)} MB)`}</span>
                                        ) : null}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Post-import actions */}
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-medium text-bolt-elements-textSecondary">
                                Post-import actions
                              </p>
                              <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-xs">
                                  <Checkbox
                                    checked={importOptions.runInstall}
                                    onCheckedChange={(v) => setImportOptions((o) => ({ ...o, runInstall: Boolean(v) }))}
                                  />
                                  Run npm install (if package.json present)
                                </label>
                                <label className="flex items-center gap-2 text-xs">
                                  <Checkbox
                                    checked={importOptions.startDevServer}
                                    onCheckedChange={(v) =>
                                      setImportOptions((o) => ({ ...o, startDevServer: Boolean(v) }))
                                    }
                                  />
                                  Start dev server after import
                                </label>
                              </div>
                            </div>
                          </div>
                        </DialogDescription>
                        <div className="flex justify-end gap-2 bg-bolt-elements-background-depth-2 px-5 pb-5">
                          <DialogButton type="secondary" onClick={() => setImportPreviewState(null)}>
                            Cancel
                          </DialogButton>
                          <DialogButton
                            type="primary"
                            onClick={async () => {
                              if (!importPreviewState) {
                                return;
                              }

                              const title =
                                importOptions.title || importPreviewState.preview.rootName || 'Imported Project';

                              const selectedFolders = Object.entries(importOptions.selected)
                                .filter(([, v]) => v)
                                .map(([k]) => k);
                              const filtered = Object.fromEntries(
                                Object.entries(importPreviewState.fileState).filter(([abs]) => {
                                  const rel = abs.replace(`${WORK_DIR}/`, '');
                                  const top = rel.split('/')[0] || rel;
                                  const isFolder = rel.includes('/');

                                  if (!isFolder) {
                                    return importOptions.includeTopFiles;
                                  }

                                  return selectedFolders.includes(top);
                                }),
                              );

                              const toastId = toast.loading('Saving import...');
                              const result = await persistImportedProject(filtered, title, user?.id);

                              if (result.success) {
                                // Persist post-import options for this chat so restoration respects them
                                try {
                                  window.localStorage.setItem(
                                    `importOptions:${result.chatId}`,
                                    JSON.stringify({
                                      runInstall: importOptions.runInstall,
                                      startDevServer: importOptions.startDevServer,
                                    }),
                                  );
                                } catch {}

                                const cloudMsg =
                                  result.cloud?.status === 'error'
                                    ? ` (cloud sync failed: ${result.cloud.message || 'unknown error'})`
                                    : user?.id
                                      ? ' (synced to cloud)'
                                      : '';

                                toast.update(toastId, {
                                  render: `Imported.${cloudMsg} Restoring...`,
                                  isLoading: false,
                                  type: result.cloud?.status === 'error' ? 'warning' : 'success',
                                  autoClose: result.cloud?.status === 'error' ? 5000 : 1200,
                                });

                                // Make the workbench visible immediately for better UX
                                workbenchStore.setShowWorkbench(true);

                                setImportPreviewState(null);
                                navigate(`/chat/${result.chatId}`);
                              } else {
                                toast.update(toastId, {
                                  render: `Import failed: ${result.error}`,
                                  isLoading: false,
                                  type: 'error',
                                  autoClose: 4000,
                                });
                              }
                            }}
                          >
                            Import
                          </DialogButton>
                        </div>
                      </>
                    ) : null}
                  </Dialog>
                </DialogRoot>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel
          ref={terminalPanelRef}
          defaultSize={showTerminal ? DEFAULT_TERMINAL_SIZE : 0}
          minSize={10}
          collapsible
          onExpand={() => {
            if (!terminalToggledByShortcut.current) {
              workbenchStore.toggleTerminal(true);
            }
          }}
          onCollapse={() => {
            if (!terminalToggledByShortcut.current) {
              workbenchStore.toggleTerminal(false);
            }
          }}
        >
          <div className="h-full">
            <div className="bg-bolt-elements-terminals-background h-full flex flex-col">
              <div className="flex items-center bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor gap-1.5 min-h-[34px] p-2">
                {/* Bolt Terminal tab */}
                {(() => {
                  const isActive = activeTerminal === 0;
                  return (
                    <button
                      key="bolt"
                      className={classNames(
                        'flex items-center text-sm font-medium cursor-pointer gap-1.5 px-2.5 py-1.5 whitespace-nowrap rounded-md transition-theme',
                        isActive
                          ? 'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary border border-bolt-elements-borderColorActive shadow-sm'
                          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
                      )}
                      onClick={() => setActiveTerminal(0)}
                    >
                      <TerminalIcon
                        className={classNames('w-4 h-4', {
                          'text-bolt-elements-textSecondary': !isActive,
                          'text-bolt-elements-textPrimary': isActive,
                        })}
                      />
                      Bolt Terminal
                    </button>
                  );
                })()}
                {/* Interactive terminals */}
                {Array.from({ length: terminalCount }, (_, index) => {
                  const tabIndex = index + 1;
                  const isActive = activeTerminal === tabIndex;

                  return (
                    <button
                      key={tabIndex}
                      className={classNames(
                        'flex items-center text-sm font-medium cursor-pointer gap-1.5 px-2.5 py-1.5 whitespace-nowrap rounded-md transition-theme',
                        isActive
                          ? 'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary border border-bolt-elements-borderColorActive shadow-sm'
                          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
                      )}
                      onClick={() => setActiveTerminal(tabIndex)}
                    >
                      <TerminalIcon
                        className={classNames('w-4 h-4', {
                          'text-bolt-elements-textSecondary': !isActive,
                          'text-bolt-elements-textPrimary': isActive,
                        })}
                      />
                      Terminal {terminalCount > 1 && tabIndex}
                    </button>
                  );
                })}
                {/* Controls */}
                <div className="ml-auto flex items-center gap-1.5 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/90 px-2 py-1 transition-theme">
                  {/* Restart command selector */}
                  <select
                    className="text-sm font-medium bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary px-2 py-1 rounded-md border border-bolt-elements-borderColor transition-theme focus:border-bolt-elements-borderColorActive focus:outline-none focus:ring-0"
                    value={workbenchStore.getRestartCommand()}
                    onChange={(e) => workbenchStore.setRestartCommand(e.target.value)}
                    title="Command used for Restart"
                  >
                    <option value="npm run dev">npm run dev</option>
                    <option value="pnpm dev">pnpm dev</option>
                    <option value="yarn dev">yarn dev</option>
                    <option value="vite">vite</option>
                  </select>

                  <PanelHeaderButton
                    onClick={() => {
                      clearBoltTerminal();
                      boltXtermRef.current?.clear?.();
                    }}
                  >
                    Clear
                  </PanelHeaderButton>

                  <PanelHeaderButton onClick={() => restartDevServer()}>
                    <RefreshCcw className="w-4 h-4" /> Restart Dev
                  </PanelHeaderButton>

                  <PanelHeaderButton onClick={() => killDevServer()}>
                    <Power className="w-4 h-4" /> Stop Dev
                  </PanelHeaderButton>

                  <IconButton
                    icon={ChevronDown}
                    title="Close"
                    size="md"
                    onClick={() => workbenchStore.toggleTerminal(false)}
                  />
                </div>
              </div>
              {/* Bolt Terminal (readonly) */}
              <Terminal
                key="bolt-term"
                className={classNames('h-full overflow-hidden', {
                  hidden: activeTerminal !== 0,
                })}
                readonly
                onTerminalReady={(xterm) => {
                  boltXtermRef.current = xterm as any;

                  // write initial buffer
                  const buf = getBoltTerminalBuffer();

                  if (buf) {
                    xterm.write(buf);
                  }

                  // subscribe to new chunks
                  boltUnsubRef.current?.();
                  boltUnsubRef.current = subscribeBoltTerminal((entry) => {
                    boltXtermRef.current?.write(entry.chunk);
                  });
                }}
                theme={theme}
              />
              {/* Interactive terminals */}
              {Array.from({ length: terminalCount }, (_, index) => {
                const tabIndex = index + 1;
                const isActive = activeTerminal === tabIndex;

                return (
                  <Terminal
                    key={tabIndex}
                    className={classNames('h-full overflow-hidden', {
                      hidden: !isActive,
                    })}
                    ref={getTerminalRefCallback(index)}
                    onTerminalReady={(terminal) => workbenchStore.attachTerminal(terminal)}
                    onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                    theme={theme}
                  />
                );
              })}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    );
  },
);
