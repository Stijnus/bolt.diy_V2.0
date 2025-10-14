import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import {
  Terminal,
  XCircle,
  Download,
  RefreshCcw,
  Loader2,
  Link,
  Unlink,
  Settings,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { toast } from 'react-toastify';
import { EditorPanel } from './EditorPanel';
import { ErrorNotification } from './ErrorNotification';
import { Preview } from './Preview';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { Badge } from '~/components/ui/Badge';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { IconButton } from '~/components/ui/IconButton';
import { Label } from '~/components/ui/Label';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { Textarea } from '~/components/ui/Textarea';
import { getDatabase } from '~/lib/persistence/db';

import { settingsStore, updateLocalSyncSettings } from '~/lib/stores/settings';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';
import { classNames } from '~/utils/classNames';
import { WORK_DIR } from '~/utils/constants';
import { debounce } from '~/utils/debounce';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { waitForFileOperations } from '~/utils/sync-helpers';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
}

const viewTransition = { ease: cubicEasingFn };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(({ chatStarted, isStreaming }: WorkspaceProps) => {
  renderLogger.trace('Workbench');

  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);
  const currentProjectId = useStore(workbenchStore.currentProjectId);
  const settings = useStore(settingsStore);

  /*
   * Auto-save functionality
   * Note: autoSaveTimeoutRef is reserved for future auto-save timer implementation
   */

  const debouncedAutoSave = useCallback(
    debounce(() => {
      if (settings.preferences.autoSave && currentDocument && unsavedFiles.has(currentDocument.filePath)) {
        workbenchStore.saveCurrentDocument().catch(() => {
          // Silent fail for auto-save to avoid annoying the user
        });
      }
    }, settings.preferences.autoSaveDelay || 1000),
    [settings.preferences.autoSave, settings.preferences.autoSaveDelay, currentDocument, unsavedFiles],
  );

  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };

  useEffect(() => {
    if (hasPreview) {
      setSelectedView('preview');
    }
  }, [hasPreview]);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  useEffect(() => {
    if (!currentProjectId) {
      workbenchStore.setDocuments({});
      workbenchStore.setSelectedFile(undefined);

      return;
    }

    workbenchStore.setDocuments(files);
  }, [currentProjectId]);

  const onEditorChange = useCallback<OnEditorChange>(
    (update) => {
      workbenchStore.setCurrentDocumentContent(update.content);

      // Trigger auto-save if enabled
      if (settings.preferences.autoSave) {
        debouncedAutoSave();
      }
    },
    [debouncedAutoSave, settings.preferences.autoSave],
  );

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      toast.error('Failed to update file content');
    });
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    setExporting(true);

    try {
      const wc = await webcontainer;

      // Export project tree as JSON to walk and filter
      const tree: any = await wc.export('.', { format: 'json' as const });
      const root = tree?.directory ?? tree;

      const outBase = `.bolt-export-${Date.now()}`;
      await wc.fs.mkdir(outBase, { recursive: true });

      const ensureDir = async (dir: string) => {
        if (!dir || dir === '.' || dir === '/') {
          return;
        }

        try {
          await wc.fs.mkdir(dir, { recursive: true });
        } catch {}
      };

      const walk = async (prefix: string, node: Record<string, any>) => {
        if (!node) {
          return;
        }

        for (const [name, entry] of Object.entries(node)) {
          const relPath = prefix ? `${prefix}/${name}` : name;

          // Skip node_modules anywhere in the path
          if (relPath.split('/').includes('node_modules')) {
            continue;
          }

          if (entry && typeof entry === 'object' && 'directory' in entry) {
            await ensureDir(`${outBase}/${relPath}`);
            await walk(relPath, entry.directory as Record<string, any>);
          } else if (entry && typeof entry === 'object' && 'file' in entry) {
            const fileEntry = entry.file as { contents?: string | Uint8Array; symlink?: string };

            if ('symlink' in fileEntry && typeof fileEntry.symlink === 'string') {
              continue;
            }

            const contents = fileEntry.contents;
            const targetPath = `${outBase}/${relPath}`;
            await ensureDir(targetPath.split('/').slice(0, -1).join('/'));

            if (typeof contents === 'string') {
              await wc.fs.writeFile(targetPath, contents);
            } else if (contents instanceof Uint8Array) {
              await wc.fs.writeFile(targetPath, contents);
            } else {
              await wc.fs.writeFile(targetPath, '');
            }
          }
        }
      };

      await walk('', root as Record<string, any>);

      // Package as zip archive and download
      const zipData: Uint8Array = await wc.export(outBase, { format: 'zip' as const });
      const blob = new Blob([zipData.buffer as ArrayBuffer], { type: 'application/zip' });

      const dateStr = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Project exported');

      // Attempt cleanup (best-effort)
      try {
        // @ts-ignore optional rm may not exist
        await wc.fs.rm?.(outBase, { recursive: true, force: true });
      } catch {}
    } catch (e) {
      console.error(e);
      toast.error('Failed to export project');
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  // Try to restore a previously approved local directory handle
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const db = await getDatabase();

        if (!db) {
          return;
        }

        const tx = db.transaction('app_settings', 'readonly');
        const store = tx.objectStore('app_settings');
        const req = store.get('local_sync');

        req.onsuccess = async () => {
          if (cancelled) {
            return;
          }

          const rec = (req.result as any) ?? null;
          const saved: FileSystemDirectoryHandle | undefined = rec?.handle;

          try {
            if (saved && typeof (saved as any).queryPermission === 'function') {
              const perm = await (saved as any).queryPermission({ mode: 'readwrite' });

              if (perm === 'granted') {
                setDirHandle(saved);
              }
            }
          } catch {}
        };
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync to local folder using File System Access API
  const [syncing, setSyncing] = useState(false);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const [autoSync, setAutoSync] = useState(false);
  const [exclusionsOpen, setExclusionsOpen] = useState(false);
  const [exclusionsText, setExclusionsText] = useState('');

  // Initialize autoSync and exclusions from settings
  useEffect(() => {
    const pref = settings.preferences.localSync;
    setAutoSync(!!pref?.autoSync);

    const excludes = pref?.excludes?.length
      ? pref.excludes
      : ['node_modules', '.vite', '.remix', 'public/build', 'dist'];
    setExclusionsText(excludes.join(', '));
  }, [settings.preferences.localSync]);

  // Persist autoSync preference when it changes
  useEffect(() => {
    updateLocalSyncSettings({ autoSync });
  }, [autoSync]);

  const ensureLocalDir = useCallback(async (base: FileSystemDirectoryHandle, path: string) => {
    const parts = path.split('/').filter(Boolean);

    let current = base;

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part, { create: true });
      } catch {
        // try again without create (if it already exists)
        current = await current.getDirectoryHandle(part, { create: false });
      }
    }

    return current;
  }, []);

  const writeLocalFile = useCallback(
    async (base: FileSystemDirectoryHandle, filePath: string, data: string | Uint8Array) => {
      const segments = filePath.split('/').filter(Boolean);
      const fileName = segments.pop()!;
      const folderPath = segments.join('/');

      const dir = folderPath ? await ensureLocalDir(base, folderPath) : base;
      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      if (typeof data === 'string') {
        await writable.write(data);
      } else {
        const ab = (data as Uint8Array).slice().buffer as ArrayBuffer;
        await writable.write(new Blob([ab]));
      }

      await writable.close();
    },
    [ensureLocalDir],
  );

  const handleSync = useCallback(async () => {
    if (syncing) {
      return;
    }

    setSyncing(true);

    try {
      // Ask for folder on first run
      let target = dirHandle;

      if (!target) {
        if (!('showDirectoryPicker' in window)) {
          toast.error('Your browser does not support folder access for sync. Try Chrome or Edge.');
          setSyncing(false);

          return;
        }

        // @ts-ignore - TS lib may lack the specific Window type for showDirectoryPicker
        target = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(target as FileSystemDirectoryHandle);

        // Persist handle for future sessions (Chrome/Edge support structured clone)
        try {
          const db = await getDatabase();

          if (db) {
            const tx = db.transaction('app_settings', 'readwrite');
            const store = tx.objectStore('app_settings');
            store.put({ id: 'local_sync', handle: target });
          }
        } catch {}
      }

      const wc = await webcontainer;

      // Excludes: user-configured (Settings) with sane defaults
      const excludesList = settings.preferences.localSync?.excludes?.length
        ? settings.preferences.localSync!.excludes
        : ['node_modules', '.vite', '.remix', 'public/build', 'dist'];

      const excludesSet = new Set(excludesList);

      const shouldExclude = (relPath: string) => relPath.split('/').some((p) => excludesSet.has(p));

      // Incremental sync if there are modified files; otherwise fall back to full export walk
      const modifications = workbenchStore.getFileModifications?.() as
        | Record<string, { type: 'diff' | 'file'; content: string }>
        | undefined;

      if (modifications && Object.keys(modifications).length > 0) {
        const fileMap = workbenchStore.files.get();

        let count = 0;

        for (const filePath of Object.keys(modifications)) {
          const relPath = filePath.startsWith(`${WORK_DIR}/`)
            ? filePath.slice(WORK_DIR.length + 1)
            : filePath.replace(/^\//, '');

          if (shouldExclude(relPath)) {
            continue;
          }

          const entry = fileMap[filePath];

          try {
            if (entry && entry.type === 'file') {
              if (entry.isBinary) {
                const data = (await wc.fs.readFile(relPath)) as unknown as Uint8Array;
                await writeLocalFile(target!, relPath, data);
              } else {
                await writeLocalFile(target!, relPath, entry.content);
              }
            } else {
              // fallback: read from FS
              const data = (await wc.fs.readFile(relPath)) as unknown as Uint8Array;
              await writeLocalFile(target!, relPath, data);
            }

            count++;
          } catch (err) {
            console.warn('Failed to sync file', filePath, err);
          }
          updateLocalSyncSettings({ lastSyncedAt: new Date().toISOString() });
        }

        toast.success(`Synced ${count} changed file${count === 1 ? '' : 's'} to local folder`);
      } else {
        // Full export walk fallback
        const tree: any = await wc.export('.', { format: 'json' as const });
        const root = tree?.directory ?? tree;

        const walkToLocal = async (prefix: string, node: Record<string, any>) => {
          if (!node) {
            return;
          }

          for (const [name, entry] of Object.entries(node)) {
            const relPath = prefix ? `${prefix}/${name}` : name;

            // Skip default excluded paths
            if (shouldExclude(relPath)) {
              continue;
            }

            if (entry && typeof entry === 'object' && 'directory' in entry) {
              await walkToLocal(relPath, entry.directory as Record<string, any>);
            } else if (entry && typeof entry === 'object' && 'file' in entry) {
              const fileEntry = entry.file as { contents?: string | Uint8Array; symlink?: string };

              if ('symlink' in fileEntry && typeof fileEntry.symlink === 'string') {
                continue;
              }

              const contents = fileEntry.contents;

              if (typeof contents === 'string') {
                await writeLocalFile(target!, relPath, contents);
              } else if (contents instanceof Uint8Array) {
                await writeLocalFile(target!, relPath, contents);
              } else {
                await writeLocalFile(target!, relPath, '');
              }
            }
          }
          updateLocalSyncSettings({ lastSyncedAt: new Date().toISOString() });
        };

        await walkToLocal('', root as Record<string, any>);
        toast.success('Synced project to local folder');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync to local folder');
    } finally {
      setSyncing(false);
    }
  }, [dirHandle, syncing]);

  // Auto-sync: debounce sync after file operations settle
  const debouncedSync = useMemo(
    () =>
      debounce(() => {
        void handleSync();
      }, 800),
    [handleSync],
  );

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (autoSync) {
      unsub = workbenchStore.files.subscribe(async () => {
        try {
          await waitForFileOperations(workbenchStore, { stabilityDelay: 200 });
          debouncedSync();
        } catch {
          // ignore
        }
      });
    }

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [autoSync, debouncedSync]);

  const connectLocalFolder = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      toast.error('Your browser does not support folder access for sync. Try Chrome or Edge.');
      return;
    }

    try {
      // @ts-ignore - TS lib may lack the specific Window type for showDirectoryPicker
      const picked = (await (window as any).showDirectoryPicker({ mode: 'readwrite' })) as FileSystemDirectoryHandle;
      setDirHandle(picked);

      // Persist handle for future sessions
      try {
        const db = await getDatabase();

        if (db) {
          const tx = db.transaction('app_settings', 'readwrite');
          const store = tx.objectStore('app_settings');
          store.put({ id: 'local_sync', handle: picked });
        }
      } catch {}

      toast.success('Connected local folder');
    } catch {
      // user may cancel picker
    }
  }, []);

  const disconnectLocalFolder = useCallback(async () => {
    setDirHandle(null);

    try {
      const db = await getDatabase();

      if (db) {
        const tx = db.transaction('app_settings', 'readwrite');
        const store = tx.objectStore('app_settings');
        store.delete('local_sync');
      }
    } catch {}

    toast.info('Disconnected local folder');
  }, []);

  return (
    chatStarted && (
      <motion.div
        initial="closed"
        animate={showWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-[3]"
      >
        <div
          className={classNames(
            'fixed top-[calc(var(--header-height)+1.5rem)] bottom-6 w-[var(--workbench-inner-width)] mr-4 z-0 transition-[left,width] duration-200 ease-bolt-ease-cubic-bezier',

            {
              'left-[var(--workbench-left)]': showWorkbench,
              'left-[100%]': !showWorkbench,
            },
          )}
        >
          <div className="absolute inset-0 px-6">
            <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm rounded-lg overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                <div className="ml-auto" />
                {selectedView === 'code' && (
                  <>
                    <PanelHeaderButton className="mr-1 text-sm" disabled={exporting} onClick={handleExport}>
                      <Download className="w-4 h-4" />
                      Export
                    </PanelHeaderButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <PanelHeaderButton
                          className={classNames('mr-1 text-sm', {
                            'text-green-600': !syncing && !!dirHandle,
                            'text-amber-600': !syncing && !dirHandle && autoSync,
                          })}
                          disabled={syncing}
                        >
                          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                          {syncing ? 'Syncing…' : dirHandle ? 'Sync (Connected)' : 'Sync'}
                        </PanelHeaderButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleSync();
                          }}
                        >
                          <RefreshCcw className="mr-2 w-4 h-4" />
                          Sync now
                        </DropdownMenuItem>
                        <DropdownMenuCheckboxItem checked={autoSync} onCheckedChange={(v) => setAutoSync(Boolean(v))}>
                          <CheckCircle
                            className={classNames('mr-2 w-4 h-4', {
                              'text-green-600': autoSync,
                            })}
                          />
                          Auto Sync
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            void connectLocalFolder();
                          }}
                        >
                          <Link className="mr-2 w-4 h-4" />
                          Connect Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!dirHandle}
                          onSelect={(e) => {
                            e.preventDefault();
                            void disconnectLocalFolder();
                          }}
                        >
                          <Unlink className="mr-2 w-4 h-4" />
                          Disconnect Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setExclusionsOpen(true);
                          }}
                        >
                          <Settings className="mr-2 w-4 h-4" />
                          Configure Exclusions…
                        </DropdownMenuItem>
                        {settings.preferences.localSync?.lastSyncedAt && (
                          <DropdownMenuItem disabled>
                            <Clock className="mr-2 w-4 h-4" />
                            Last synced {new Date(settings.preferences.localSync.lastSyncedAt).toLocaleString()}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {dirHandle && (
                      <Badge
                        variant="success"
                        className={classNames('mr-2', {
                          'animate-pulse': syncing,
                        })}
                      >
                        <Link className="w-3 h-3" />
                        {dirHandle.name}
                      </Badge>
                    )}
                    {autoSync && (
                      <Badge
                        variant="primary"
                        className={classNames('mr-2', {
                          'animate-pulse': syncing,
                        })}
                      >
                        {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Auto Sync
                      </Badge>
                    )}

                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                      }}
                    >
                      <Terminal className="w-4 h-4" />
                      Toggle Terminal
                    </PanelHeaderButton>
                  </>
                )}
                <IconButton
                  icon={XCircle}
                  className="-mr-1"
                  size="xl"
                  onClick={() => {
                    workbenchStore.showWorkbench.set(false);
                  }}
                />
              </div>
              <div className="relative flex-1 overflow-hidden">
                <View
                  initial={{ x: selectedView === 'code' ? 0 : '-100%' }}
                  animate={{ x: selectedView === 'code' ? 0 : '-100%' }}
                >
                  <EditorPanel
                    editorDocument={currentDocument}
                    isStreaming={isStreaming}
                    selectedFile={selectedFile}
                    files={files}
                    unsavedFiles={unsavedFiles}
                    onFileSelect={onFileSelect}
                    onEditorScroll={onEditorScroll}
                    onEditorChange={onEditorChange}
                    onFileSave={onFileSave}
                    onFileReset={onFileReset}
                  />
                </View>
                <View
                  initial={{ x: selectedView === 'preview' ? 0 : '100%' }}
                  animate={{ x: selectedView === 'preview' ? 0 : '100%' }}
                >
                  <Preview />
                </View>
              </div>
            </div>
          </div>
          <ErrorNotification />
        </div>
        <DialogRoot open={exclusionsOpen} onOpenChange={setExclusionsOpen}>
          <Dialog>
            <DialogTitle>Local Sync: Exclusions</DialogTitle>
            <DialogDescription>
              Enter folders or files to exclude from sync (comma or newline separated).
            </DialogDescription>
            <div className="mt-3 space-y-2">
              <Label htmlFor="exclusions">Exclude patterns</Label>
              <Textarea
                id="exclusions"
                rows={6}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <DialogButton
                type="primary"
                onClick={() => {
                  const list = exclusionsText
                    .split(/[\,\n]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateLocalSyncSettings({ excludes: list });
                  setExclusionsOpen(false);
                  toast.success('Updated local sync exclusions');
                }}
              >
                Save
              </DialogButton>
              <DialogButton
                type="secondary"
                onClick={() => {
                  setExclusionsText(['node_modules', '.vite', '.remix', 'public/build', 'dist'].join(', '));
                }}
              >
                Reset defaults
              </DialogButton>
            </div>
          </Dialog>
        </DialogRoot>
      </motion.div>
    )
  );
});

interface ViewProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
