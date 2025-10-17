import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Circle,
  Pencil,
  Trash2,
  FolderPlus,
  FilePlus,
  MoreVertical,
} from 'lucide-react';
import { memo, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/DropdownMenu';
import { IconButton } from '~/components/ui/IconButton';
import type { FileMap } from '~/lib/stores/files';
import { classNames } from '~/utils/classNames';
import { createScopedLogger, renderLogger } from '~/utils/logger';

const logger = createScopedLogger('FileTree');

const NODE_PADDING_LEFT = 8;
const DEFAULT_HIDDEN_FILES = [/\/node_modules\//, /\/\.next/, /\/\.astro/];

interface Props {
  files?: FileMap;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  rootFolder?: string;
  hideRoot?: boolean;
  collapsed?: boolean;
  allowFolderSelection?: boolean;
  hiddenFiles?: Array<string | RegExp>;
  unsavedFiles?: Set<string>;
  className?: string;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onDelete?: (path: string) => void;
}

export const FileTree = memo(
  ({
    files = {},
    onFileSelect,
    selectedFile,
    rootFolder,
    hideRoot = false,
    collapsed = false,
    allowFolderSelection = false,
    hiddenFiles,
    className,
    unsavedFiles,
    onCreateFile,
    onCreateFolder,
    onRename,
    onDelete,
  }: Props) => {
    renderLogger.trace('FileTree');

    const computedHiddenFiles = useMemo(() => [...DEFAULT_HIDDEN_FILES, ...(hiddenFiles ?? [])], [hiddenFiles]);

    const fileList = useMemo(() => {
      logger.debug('FileTree: building file list', {
        filesCount: Object.keys(files).length,
        rootFolder,
        hideRoot,
        fileKeys: Object.keys(files),
      });

      const list = buildFileList(files, rootFolder, hideRoot, computedHiddenFiles);
      logger.debug('FileTree: built file list', { listLength: list.length, list });

      return list;
    }, [files, rootFolder, hideRoot, computedHiddenFiles]);

    const [collapsedFolders, setCollapsedFolders] = useState(() => {
      return collapsed
        ? new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath))
        : new Set<string>();
    });

    useEffect(() => {
      if (collapsed) {
        setCollapsedFolders(new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath)));
        return;
      }

      setCollapsedFolders((prevCollapsed) => {
        const newCollapsed = new Set<string>();

        for (const folder of fileList) {
          if (folder.kind === 'folder' && prevCollapsed.has(folder.fullPath)) {
            newCollapsed.add(folder.fullPath);
          }
        }

        return newCollapsed;
      });
    }, [fileList, collapsed]);

    const filteredFileList = useMemo(() => {
      const list = [];

      let lastDepth = Number.MAX_SAFE_INTEGER;

      for (const fileOrFolder of fileList) {
        const depth = fileOrFolder.depth;

        // if the depth is equal we reached the end of the collaped group
        if (lastDepth === depth) {
          lastDepth = Number.MAX_SAFE_INTEGER;
        }

        // ignore collapsed folders
        if (collapsedFolders.has(fileOrFolder.fullPath)) {
          lastDepth = Math.min(lastDepth, depth);
        }

        // ignore files and folders below the last collapsed folder
        if (lastDepth < depth) {
          continue;
        }

        list.push(fileOrFolder);
      }

      return list;
    }, [fileList, collapsedFolders]);

    const toggleCollapseState = (fullPath: string) => {
      setCollapsedFolders((prevSet) => {
        const newSet = new Set(prevSet);

        if (newSet.has(fullPath)) {
          newSet.delete(fullPath);
        } else {
          newSet.add(fullPath);
        }

        return newSet;
      });
    };

    return (
      <div className={classNames('text-sm h-full overflow-y-auto overflow-x-hidden', className)}>
        {filteredFileList.map((fileOrFolder) => {
          switch (fileOrFolder.kind) {
            case 'file': {
              return (
                <File
                  key={fileOrFolder.id}
                  selected={selectedFile === fileOrFolder.fullPath}
                  file={fileOrFolder}
                  unsavedChanges={unsavedFiles?.has(fileOrFolder.fullPath)}
                  onClick={() => {
                    onFileSelect?.(fileOrFolder.fullPath);
                  }}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              );
            }
            case 'folder': {
              return (
                <Folder
                  key={fileOrFolder.id}
                  folder={fileOrFolder}
                  selected={allowFolderSelection && selectedFile === fileOrFolder.fullPath}
                  collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
                  onClick={() => {
                    toggleCollapseState(fileOrFolder.fullPath);
                  }}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              );
            }
            default: {
              return undefined;
            }
          }
        })}
      </div>
    );
  },
);

export default FileTree;

interface FolderProps {
  folder: FolderNode;
  collapsed: boolean;
  selected?: boolean;
  onClick: () => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onDelete?: (path: string) => void;
}

function Folder({
  folder: { depth, name, fullPath },
  collapsed,
  selected = false,
  onClick,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: FolderProps) {
  const { actionMenu, editing, inputHandlers } = useNodeActions({
    type: 'folder',
    name,
    fullPath,
    onCreateFile,
    onCreateFolder,
    onRename,
    onDelete,
  });

  const label = editing ? <InlineRenameInput {...inputHandlers} /> : <NodeLabel name={name} />;

  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover-bg-bolt-elements-item-backgroundActive':
          !selected,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': selected,
      })}
      depth={depth}
      icon={collapsed ? <ChevronRight className="w-4 h-4 scale-98" /> : <ChevronDown className="w-4 h-4 scale-98" />}
      onClick={editing ? undefined : onClick}
      interactive={!editing}
      actionMenu={editing ? null : actionMenu}
    >
      {label}
    </NodeButton>
  );
}

interface FileProps {
  file: FileNode;
  selected: boolean;
  unsavedChanges?: boolean;
  onClick: () => void;
  onRename?: (oldPath: string, newName: string) => void;
  onDelete?: (path: string) => void;
}

function File({
  file: { depth, name, fullPath },
  onClick,
  selected,
  unsavedChanges = false,
  onRename,
  onDelete,
}: FileProps) {
  const { actionMenu, editing, inputHandlers } = useNodeActions({
    type: 'file',
    name,
    fullPath,
    onRename,
    onDelete,
  });

  const label = editing ? (
    <InlineRenameInput {...inputHandlers} />
  ) : (
    <NodeLabel
      name={name}
      trailingIcon={unsavedChanges ? <Circle className="w-2 h-2 shrink-0 text-orange-500 fill-current" /> : null}
    />
  );

  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentDefault': !selected,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': selected,
      })}
      depth={depth}
      icon={
        <FileIcon
          className={classNames('w-4 h-4 scale-98', {
            'group-hover:text-bolt-elements-item-contentActive': !selected,
          })}
        />
      }
      onClick={editing ? undefined : onClick}
      interactive={!editing}
      actionMenu={editing ? null : actionMenu}
    >
      {label}
    </NodeButton>
  );
}

interface ButtonProps {
  depth: number;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  actionMenu?: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
}

function NodeButton({ depth, icon, onClick, className, children, actionMenu, interactive = true }: ButtonProps) {
  return (
    <div
      className={classNames('flex items-center w-full pr-2 border-2 border-transparent text-faded py-0.5', className)}
    >
      {interactive ? (
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 text-left"
          style={{ paddingLeft: `${6 + depth * NODE_PADDING_LEFT}px` }}
          onClick={() => onClick?.()}
        >
          <div className="scale-120 shrink-0">{icon}</div>
          <div className="truncate w-full text-left">{children}</div>
        </button>
      ) : (
        <div
          className="flex items-center gap-1.5 flex-1 text-left"
          style={{ paddingLeft: `${6 + depth * NODE_PADDING_LEFT}px` }}
        >
          <div className="scale-120 shrink-0">{icon}</div>
          <div className="truncate w-full text-left">{children}</div>
        </div>
      )}
      {actionMenu ? <div className="ml-1 shrink-0">{actionMenu}</div> : null}
    </div>
  );
}

interface UseNodeActionsArgs {
  type: 'file' | 'folder';
  name: string;
  fullPath: string;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onDelete?: (path: string) => void;
}

function useNodeActions({
  type,
  name,
  fullPath,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: UseNodeActionsArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleRenameSubmit = useCallback(
    (newName: string) => {
      const trimmed = newName.trim();

      if (!trimmed || trimmed === name || !onRename) {
        setIsEditing(false);
        setIsOpen(false);

        return;
      }

      onRename(fullPath, trimmed);
      setIsEditing(false);
      setIsOpen(false);
    },
    [fullPath, name, onRename],
  );

  const handleRenameCancel = useCallback(() => {
    setIsEditing(false);
    setIsOpen(false);
  }, []);

  const actionMenu = (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <IconButton
          icon={MoreVertical}
          size="md"
          className="opacity-70 transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
          title="Open actions"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="min-w-[160px]">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => {
            if (!onRename) {
              return;
            }

            setIsEditing(true);
            setIsOpen(false);
          }}
        >
          <Pencil className="w-4 h-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => {
            onDelete?.(fullPath);
            setIsOpen(false);
          }}
        >
          <Trash2 className="w-4 h-4" /> Delete
        </DropdownMenuItem>
        {type === 'folder' ? (
          <>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                onCreateFile?.(fullPath);
                setIsOpen(false);
              }}
            >
              <FilePlus className="w-4 h-4" /> New file
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                onCreateFolder?.(fullPath);
                setIsOpen(false);
              }}
            >
              <FolderPlus className="w-4 h-4" /> New folder
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return {
    actionMenu,
    editing: isEditing,
    inputHandlers: {
      name,
      onSubmit: handleRenameSubmit,
      onCancel: handleRenameCancel,
    },
  };
}

interface InlineRenameInputProps {
  name: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

function InlineRenameInput({ name, onSubmit, onCancel }: InlineRenameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(name);
  const actionRef = useRef<'none' | 'submit' | 'cancel'>('none');

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  return (
    <div
      className="flex items-center gap-2"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          actionRef.current = 'cancel';
          onCancel();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          actionRef.current = 'submit';
          onSubmit(value);
        }
      }}
    >
      <input
        ref={inputRef}
        className="w-full rounded bg-bolt-elements-background-depth-3 px-2 py-1 text-sm text-bolt-elements-textPrimary outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (actionRef.current === 'none') {
            actionRef.current = 'submit';
            onSubmit(value);
          }
        }}
      />
    </div>
  );
}

interface NodeLabelProps {
  name: string;
  trailingIcon?: ReactNode;
}

function NodeLabel({ name, trailingIcon }: NodeLabelProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 truncate pr-2">{name}</div>
      {trailingIcon}
    </div>
  );
}

type Node = FileNode | FolderNode;

interface BaseNode {
  id: number;
  depth: number;
  name: string;
  fullPath: string;
}

interface FileNode extends BaseNode {
  kind: 'file';
}

interface FolderNode extends BaseNode {
  kind: 'folder';
}

function buildFileList(
  files: FileMap,
  rootFolder = '/',
  hideRoot: boolean,
  hiddenFiles: Array<string | RegExp>,
): Node[] {
  const folderPaths = new Set<string>();
  const fileList: Node[] = [];

  let defaultDepth = 0;

  if (rootFolder === '/' && !hideRoot) {
    defaultDepth = 1;
    fileList.push({ kind: 'folder', name: '/', depth: 0, id: 0, fullPath: '/' });
  }

  for (const [filePath, dirent] of Object.entries(files)) {
    const segments = filePath.split('/').filter((segment) => segment);
    const fileName = segments.at(-1);

    if (!fileName || isHiddenFile(filePath, fileName, hiddenFiles)) {
      continue;
    }

    let currentPath = '';

    let i = 0;
    let depth = 0;

    while (i < segments.length) {
      const name = segments[i];
      const fullPath = (currentPath += `/${name}`);

      // check if this segment should be included
      const shouldInclude = fullPath.startsWith(rootFolder) && !(hideRoot && fullPath === rootFolder);

      if (shouldInclude) {
        if (i === segments.length - 1 && dirent?.type === 'file') {
          fileList.push({
            kind: 'file',
            id: fileList.length,
            name,
            fullPath,
            depth: depth + defaultDepth,
          });
        } else if (!folderPaths.has(fullPath)) {
          folderPaths.add(fullPath);

          fileList.push({
            kind: 'folder',
            id: fileList.length,
            name,
            fullPath,
            depth: depth + defaultDepth,
          });
        }

        depth++;
      }

      i++;
    }
  }

  return sortFileList(rootFolder, fileList, hideRoot);
}

function isHiddenFile(filePath: string, fileName: string, hiddenFiles: Array<string | RegExp>) {
  return hiddenFiles.some((pathOrRegex) => {
    if (typeof pathOrRegex === 'string') {
      return fileName === pathOrRegex;
    }

    return pathOrRegex.test(filePath);
  });
}

/**
 * Sorts the given list of nodes into a tree structure (still a flat list).
 *
 * This function organizes the nodes into a hierarchical structure based on their paths,
 * with folders appearing before files and all items sorted alphabetically within their level.
 *
 * @note This function mutates the given `nodeList` array for performance reasons.
 *
 * @param rootFolder - The path of the root folder to start the sorting from.
 * @param nodeList - The list of nodes to be sorted.
 *
 * @returns A new array of nodes sorted in depth-first order.
 */
function sortFileList(rootFolder: string, nodeList: Node[], hideRoot: boolean): Node[] {
  logger.trace('sortFileList');

  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, Node[]>();

  // pre-sort nodes by name and type
  nodeList.sort((a, b) => compareNodes(a, b));

  for (const node of nodeList) {
    nodeMap.set(node.fullPath, node);

    const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf('/'));

    if (parentPath !== rootFolder.slice(0, rootFolder.lastIndexOf('/'))) {
      if (!childrenMap.has(parentPath)) {
        childrenMap.set(parentPath, []);
      }

      childrenMap.get(parentPath)?.push(node);
    }
  }

  const sortedList: Node[] = [];

  const depthFirstTraversal = (path: string): void => {
    const node = nodeMap.get(path);

    if (node) {
      sortedList.push(node);
    }

    const children = childrenMap.get(path);

    if (children) {
      for (const child of children) {
        if (child.kind === 'folder') {
          depthFirstTraversal(child.fullPath);
        } else {
          sortedList.push(child);
        }
      }
    }
  };

  if (hideRoot) {
    // if root is hidden, start traversal from its immediate children
    const rootChildren = childrenMap.get(rootFolder) || [];

    for (const child of rootChildren) {
      depthFirstTraversal(child.fullPath);
    }
  } else {
    depthFirstTraversal(rootFolder);
  }

  return sortedList;
}

function compareNodes(a: Node, b: Node): number {
  if (a.kind !== b.kind) {
    return a.kind === 'folder' ? -1 : 1;
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}
