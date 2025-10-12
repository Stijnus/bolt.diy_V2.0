import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { Terminal, XCircle, Download, RefreshCcw } from 'lucide-react';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'react-toastify';
import { EditorPanel } from './EditorPanel';
import { ErrorNotification } from './ErrorNotification';
import { Preview } from './Preview';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { settingsStore } from '~/lib/stores/settings';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';
import { classNames } from '~/utils/classNames';
import { debounce } from '~/utils/debounce';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';

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

  // Sync to local folder using File System Access API
  const [syncing, setSyncing] = useState(false);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

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
        const ab = new ArrayBuffer(data.byteLength);
        new Uint8Array(ab).set(data);
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
      }

      const wc = await webcontainer;
      const tree: any = await wc.export('.', { format: 'json' as const });
      const root = tree?.directory ?? tree;

      const walkToLocal = async (prefix: string, node: Record<string, any>) => {
        if (!node) {
          return;
        }

        for (const [name, entry] of Object.entries(node)) {
          const relPath = prefix ? `${prefix}/${name}` : name;

          // Skip node_modules
          if (relPath.split('/').includes('node_modules')) {
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
      };

      await walkToLocal('', root as Record<string, any>);
      toast.success('Synced project to local folder');
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync to local folder');
    } finally {
      setSyncing(false);
    }
  }, [dirHandle, syncing]);

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
                    <PanelHeaderButton className="mr-1 text-sm" disabled={syncing} onClick={handleSync}>
                      <RefreshCcw className="w-4 h-4" />
                      Sync
                    </PanelHeaderButton>
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
