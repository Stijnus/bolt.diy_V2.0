import { useStore } from '@nanostores/react';
import {
  FolderTree,
  Save,
  History,
  Terminal as TerminalIcon,
  Plus,
  ChevronDown,
  Power,
  RefreshCcw,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
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
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeader } from '~/components/ui/PanelHeader';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { shortcutEventEmitter } from '~/lib/hooks';
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

const MAX_TERMINALS = 3;
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
    const [terminalCount, setTerminalCount] = useState(1);

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

    const addTerminal = () => {
      if (terminalCount < MAX_TERMINALS) {
        setTerminalCount(terminalCount + 1);
        setActiveTerminal(terminalCount);
      }
    };

    // Keep internal ref arrays bounded to the number of terminals
    useEffect(() => {
      if (terminalRefs.current.length > terminalCount) {
        terminalRefs.current.length = terminalCount;
      }

      if (terminalRefCallbacks.current.length > terminalCount) {
        terminalRefCallbacks.current.length = terminalCount;
      }
    }, [terminalCount]);

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
              <div className="h-full flex-1 overflow-hidden">
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
                        'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                        {
                          'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary': isActive,
                          'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                            !isActive,
                        },
                      )}
                      onClick={() => setActiveTerminal(0)}
                    >
                      <TerminalIcon className="w-4 h-4" />
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
                        'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                        {
                          'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary': isActive,
                          'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                            !isActive,
                        },
                      )}
                      onClick={() => setActiveTerminal(tabIndex)}
                    >
                      <TerminalIcon className="w-4 h-4" />
                      Terminal {terminalCount > 1 && tabIndex}
                    </button>
                  );
                })}
                {/* Controls */}
                <div className="ml-auto flex items-center gap-2">
                  {/* Restart command selector */}
                  <select
                    className="text-sm bg-bolt-elements-background-depth-2 px-2 py-1 rounded-md border border-border"
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

                // do not attach to shell; readonly and fed via bus
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
                  boltUnsubRef.current = subscribeBoltTerminal((chunk) => {
                    boltXtermRef.current?.write(chunk);
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
