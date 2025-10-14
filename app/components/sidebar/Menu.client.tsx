import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { motion, type Variants } from 'framer-motion';
import { MessageSquarePlus, FolderKanban, Upload, Settings, FolderUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { ConnectionStatusBanner } from './ConnectionStatusBanner';
import { HistoryItem } from './HistoryItem';
import { HistoryItemSkeleton } from './HistoryItemSkeleton';
import { SearchBar } from './SearchBar';
import { binDates } from './date-binning';
import { LoginModal } from '~/components/auth/LoginModal';
import { HeaderDateTime } from '~/components/header/HeaderDateTime';
import { HeaderUserPanel } from '~/components/header/HeaderUserPanel';
import { SettingsModal } from '~/components/settings/SettingsModal';

import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { Separator } from '~/components/ui/Separator';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { useKeyboardShortcuts, shortcuts } from '~/hooks/useKeyboardShortcuts';

import { useAuth } from '~/lib/contexts/AuthContext';
import {
  deleteById,
  getAll,
  openDatabase,
  chatId,
  type ChatHistoryItem,
  setMessages,
  cleanupInvalidChatEntries,
} from '~/lib/persistence';

import {
  scanDirectoryForPreview,
  scanFileListForPreview,
  persistImportedProject,
  type ImportPreview,
} from '~/lib/persistence';
import { importChatFromJSON } from '~/lib/persistence/chat-actions';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { projectStore } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';
import { createClient } from '~/lib/supabase/client';

import { WORK_DIR } from '~/utils/constants';

import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';

const SIZE_WARNING_THRESHOLD = 10 * 1024 * 1024; // 10 MB
const SIZE_AUTO_UNSELECT_THRESHOLD = 50 * 1024 * 1024; // 50 MB

function formatBytes(n: number) {
  const units = ['B', 'KB', 'MB', 'GB'];

  let i = 0;
  let v = n;

  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }

  const digits = v < 10 && i > 0 ? 1 : 0;

  return `${v.toFixed(digits)} ${units[i]}`;
}

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-150px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent = { type: 'delete'; item: ChatHistoryItem } | null;

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const { user } = useAuth();
  const [database, setDatabase] = useState<IDBDatabase | undefined>(undefined);
  const navigate = useNavigate();
  const projectState = useStore(projectStore);
  const currentProjectId = projectState.currentProjectId;

  // Import preview state
  const [importPreview, setImportPreview] = useState<{
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
    if (importPreview) {
      const selected: Record<string, boolean> = {};
      const sizes = importPreview.preview.folderStats || [];
      importPreview.preview.topLevelFolders.forEach((f) => {
        const stat = sizes.find((s) => s.name === f);
        const bytes = stat?.bytes || 0;
        selected[f] = bytes < SIZE_AUTO_UNSELECT_THRESHOLD; // pre-unselect very large folders
      });

      // Default actions to true only if package.json detected in the scanned set
      const hasPkg = Object.keys(importPreview.fileState || {}).some(
        (p) => p.endsWith('/package.json') || p === '/package.json' || p.endsWith('package.json'),
      );
      setImportOptions({
        title: importPreview.preview.rootName || 'Imported Project',
        includeTopFiles: true,
        selected,
        runInstall: hasPkg,
        startDevServer: hasPkg,
      });
    }
  }, [importPreview]);

  const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

  // Mouse-based sidebar auto-open/close
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const TRIGGER_ZONE = 20; // pixels from left edge to trigger open
      const SIDEBAR_WIDTH = 360; // sidebar width in pixels

      // Open when mouse is near left edge
      if (event.clientX <= TRIGGER_ZONE && !open) {
        setOpen(true);
      }

      // Close when mouse leaves sidebar area (with some buffer)
      if (event.clientX > SIDEBAR_WIDTH + 50 && open) {
        setOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [open]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      shortcuts.toggleSidebar(() => setOpen((prev) => !prev)),
      shortcuts.newChat(() => navigate('/')),
      shortcuts.escape(() => {
        if (open) {
          setOpen(false);
        }
      }),
    ],
  });

  // Toggle favorite
  const handleToggleFavorite = useCallback((chatId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);

      if (newFavorites.has(chatId)) {
        newFavorites.delete(chatId);
      } else {
        newFavorites.add(chatId);
      }

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatFavorites', JSON.stringify(Array.from(newFavorites)));
      }

      return newFavorites;
    });
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('chatFavorites');

        if (stored) {
          setFavorites(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        logger.error('Failed to load favorites:', error);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (persistenceEnabled && typeof window !== 'undefined') {
      openDatabase()
        .then((dbInstance) => {
          if (!cancelled) {
            setDatabase(dbInstance);
          }
        })
        .catch((error) => {
          toast.error('Chat history is unavailable');
          logger.error(error);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [persistenceEnabled]);

  const loadEntries = useCallback(async () => {
    setIsLoadingChats(true);

    try {
      let remoteChats: ChatHistoryItem[] = [];

      // Clean up invalid entries from IndexedDB
      if (database) {
        try {
          const cleanedCount = await cleanupInvalidChatEntries(database);

          if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} invalid chat entries from IndexedDB`);
          }
        } catch (cleanupError) {
          logger.warn('Failed to cleanup invalid entries:', cleanupError);
        }
      }

      if (user) {
        const supabase = createClient();
        const { data, error } = await supabase.from('chats').select('*').eq('user_id', user.id);

        if (error) {
          throw error;
        }

        // Filter out invalid remote chats before processing
        let remoteResults: ChatHistoryItem[] = (data ?? [])
          .filter((chat: { url_id?: string | null }) => {
            // Filter out chats with invalid url_id
            return (
              chat.url_id &&
              chat.url_id !== 'NaN' &&
              chat.url_id !== 'undefined' &&
              chat.url_id !== 'null' &&
              chat.url_id !== 'Infinity' &&
              chat.url_id !== '-Infinity'
            );
          })
          .map((chat: any) => {
            const remoteChat = chat as {
              url_id: string;
              description?: string | null;
              messages?: unknown;
              updated_at?: string | null;
              model?: string | null;
              file_state?: Record<string, { content: string; isBinary: boolean }> | null;
              project_id?: string | null;
            };

            return {
              id: remoteChat.url_id,
              urlId: remoteChat.url_id,
              description: (remoteChat.description && remoteChat.description.trim() !== '') 
                ? remoteChat.description 
                : remoteChat.url_id,
              messages: (remoteChat.messages ?? []) as ChatHistoryItem['messages'],
              timestamp: remoteChat.updated_at ?? new Date().toISOString(),
              model: (remoteChat.model as any) ?? undefined,
              origin: 'remote' as const,
              fileState: remoteChat.file_state ?? undefined,
              projectId: remoteChat.project_id ?? null,
            } satisfies ChatHistoryItem;
          });

        // If the remote row has no projectId but a local entry does, prefer the local projectId
        if (database) {
          const localAll = await getAll(database);

          const localProjectByUrl = new Map(
            localAll.filter((i) => i.origin !== 'remote' && i.projectId).map((i) => [i.urlId, i.projectId as string]),
          );

          // Insert a blank line between const and return mapping for linting

          remoteResults = remoteResults.map((r) => ({
            ...r,
            projectId: r.projectId ?? localProjectByUrl.get(r.urlId) ?? null,
          }));
        }

        if (database) {
          await Promise.all(
            remoteResults.map((chat) =>
              setMessages(
                database,
                chat.id,
                chat.messages,
                chat.urlId,
                chat.description,
                chat.model,
                chat.timestamp,
                'remote',
                chat.fileState,
                undefined,
                undefined,
                undefined,
                chat.projectId ?? null,
              ),
            ),
          );
        }

        const matchesProject = (projectId?: string | null) =>
          currentProjectId ? projectId === currentProjectId || projectId == null : true;

        remoteChats = remoteResults.filter((chat) => matchesProject(chat.projectId));
      }

      if (database) {
        const stored = await getAll(database);

        const normalized = stored
          .filter((item) => {
            // Filter out items with invalid or missing IDs
            return (
              item.urlId &&
              item.id &&
              item.urlId !== 'NaN' &&
              item.urlId !== 'undefined' &&
              item.urlId !== 'null' &&
              item.urlId !== 'Infinity' &&
              item.urlId !== '-Infinity' &&
              item.id !== 'NaN' &&
              item.id !== 'undefined' &&
              item.id !== 'null' &&
              item.id !== 'Infinity' &&
              item.id !== '-Infinity'
            );
          })
          .map((item) => ({
            ...item,
            description: (item.description && item.description.trim() !== '') 
              ? item.description 
              : item.urlId,
            origin: item.origin ?? 'local',
          }));

        const matchesProject = (projectId?: string | null) =>
          currentProjectId ? projectId === currentProjectId || projectId == null : true;

        /*
         * Merge strategy:
         * - Guests: show local (non-remote) entries only
         * - Logged-in: show remote entries; include local entries that are not yet present in remote (avoid flicker)
         */
        const remoteUrlIds = new Set(remoteChats.map((c) => c.urlId));

        const keepForUser = (item: (typeof normalized)[number]) => {
          if (!user) {
            return item.origin !== 'remote';
          }

          if (item.origin === 'remote') {
            return true;
          }

          // local entry: keep it only if there is no matching remote yet
          return item.urlId ? !remoteUrlIds.has(item.urlId) : true;
        };

        const filtered = normalized.filter((item) => keepForUser(item));
        const projectFiltered = filtered.filter((item) => matchesProject(item.projectId));

        if (!user) {
          const remoteOnly = normalized.filter((item) => item.origin === 'remote');

          if (remoteOnly.length > 0) {
            await Promise.all(remoteOnly.map((item) => deleteById(database, item.id).catch(() => void 0)));
          }
        } else {
          const localOnly = normalized.filter((item) => item.origin === 'local');

          if (localOnly.length > 0) {
            logger.info(`Migrating ${localOnly.length} local guest chats to Supabase for logged-in user`);

            const supabase = createClient();

            const upsertPayloads = localOnly.map((item) => ({
              url_id: item.urlId,
              user_id: user?.id,
              messages: item.messages as any,
              description: item.description ?? null,
              model: item.model ?? null,
              file_state: item.fileState ?? null,
              terminal_state: item.terminalState ?? null,
              workbench_state: item.workbenchState ?? null,
              editor_state: item.editorState ?? null,
              project_id: item.projectId ?? null,
              updated_at: new Date().toISOString(),
            }));

            try {
              const { error } = await supabase
                .from('chats')
                .upsert(upsertPayloads, {
                  onConflict: 'url_id,user_id',
                })
                .eq('user_id', user.id);

              if (error) {
                throw error;
              }

              await Promise.all(
                localOnly.map((item) =>
                  setMessages(
                    database,
                    item.id,
                    item.messages,
                    item.urlId,
                    item.description,
                    item.model,
                    item.timestamp,
                    'remote',
                    item.fileState,
                    item.terminalState,
                    item.workbenchState,
                    item.editorState,
                    item.projectId ?? null,
                  ),
                ),
              );
            } catch (migrationError) {
              logger.error('Failed to migrate guest chats to Supabase:', migrationError);
              toast.error('Failed to sync local chats to cloud. They will remain available locally.');
            }
          }
        }

        setList(projectFiltered);
      } else {
        setList(remoteChats);
      }
    } catch (error: any) {
      toast.error('Failed to load conversations');
      logger.error(error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [currentProjectId, database, user]);

  const deleteItem = useCallback(
    async (event: React.UIEvent, item: ChatHistoryItem) => {
      event.preventDefault();

      if (!database) {
        return;
      }

      try {
        // Delete from IndexedDB first
        await deleteById(database, item.id);

        // If user is authenticated, also delete from Supabase
        if (user && item.urlId) {
          try {
            setSyncing(true);
            setConnectionError(null);

            const supabase = createClient();

            const { error } = await supabase.from('chats').delete().eq('user_id', user.id).eq('url_id', item.urlId);

            if (error) {
              logger.error('Failed to delete chat from Supabase:', error);
              setConnectionError(`Delete from cloud failed: ${error.message}`);
              toast.error('Chat deleted locally but failed to delete from cloud');
            } else {
              logger.info(`Chat ${item.urlId} deleted from Supabase`);
            }
          } catch (error) {
            logger.error('Error deleting from Supabase:', error);
            setConnectionError(`Cloud delete error: ${(error as Error).message}`);
            toast.error('Chat deleted locally but failed to delete from cloud');
          } finally {
            setSyncing(false);
          }
        }

        // Reload the entries to update the UI
        await loadEntries();

        // Navigate away if we're currently viewing the deleted chat
        if (chatId.get() === item.id) {
          window.location.pathname = '/';
        }

        toast.success('Conversation deleted successfully');
      } catch (error) {
        toast.error('Failed to delete conversation');
        logger.error(error);
      }
    },
    [database, loadEntries, user],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFolderClick = async () => {
    try {
      // Prefer modern directory picker if available
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - showDirectoryPicker is not yet typed across all TS DOM libs
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        const toastId = toast.loading('Scanning folder...');
        const { fileState, preview } = await scanDirectoryForPreview(dirHandle);
        toast.update(toastId, { render: 'Preview ready', isLoading: false, autoClose: 800, type: 'success' });
        setImportPreview({ preview, fileState });
      } else {
        // Fallback: hidden input with webkitdirectory
        dirInputRef.current?.click();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Folder import cancelled or failed');
    }
  };

  // Listen for global quick action from UserMenu to open import folder dialog
  useEffect(() => {
    const onOpen = () => {
      handleImportFolderClick();
    };
    window.addEventListener('bolt:open-import-dialog', onOpen);

    return () => window.removeEventListener('bolt:open-import-dialog', onOpen);
  }, []);

  const handleDirInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const toastId = toast.loading('Scanning folder...');

    try {
      const { fileState, preview } = await scanFileListForPreview(files);
      toast.update(toastId, { render: 'Preview ready', isLoading: false, autoClose: 800, type: 'success' });
      setImportPreview({ preview, fileState });
    } catch (e: any) {
      toast.update(toastId, { render: e?.message || 'Scan failed', isLoading: false, type: 'error', autoClose: 4000 });
    } finally {
      if (dirInputRef.current) {
        dirInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const jsonContent = await file.text();
      const result = await importChatFromJSON(jsonContent, user?.id);

      if (result.success && result.chatId) {
        await loadEntries();
        navigate(`/chat/${result.chatId}`);
      }
    } catch (error) {
      logger.error('Failed to read import file:', error);
      toast.error('Failed to read import file');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (open) {
      void loadEntries();
    }
  }, [open, loadEntries]);

  // Reload chats when the active project changes so the list reflects the selected context immediately
  useEffect(() => {
    if (!database) {
      return;
    }

    void loadEntries();
  }, [currentProjectId, database, loadEntries]);

  // Filter chats based on search query and validity
  const filteredList = (searchQuery
    ? list.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
          item.description?.toLowerCase().includes(query) ||
          item.urlId?.toLowerCase().includes(query) ||
          item.model?.toLowerCase().includes(query)
        );
      })
    : list
  ).filter((item) => {
    // Additional validation: exclude chats with empty or invalid data
    const hasValidDescription = item.description && item.description.trim() !== '';
    const hasValidUrlId = item.urlId && item.urlId.trim() !== '';
    const hasMessages = Array.isArray(item.messages) && item.messages.length > 0;
    
    // Only show items that have messages and either a description or urlId
    return hasMessages && (hasValidDescription || hasValidUrlId);
  });

  // Separate favorites and regular chats
  const favoriteChatsList = filteredList.filter((item) => favorites.has(item.id));
  const regularChatsList = filteredList.filter((item) => !favorites.has(item.id));

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        className="side-menu pointer-events-auto fixed top-0 z-[997] flex h-full w-[360px] flex-col border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-6 py-4 shadow-sm">
          {/* Top Row: Date/Time & Theme */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex-shrink-0 animate-fadeIn">
              <HeaderDateTime />
            </div>
            <div className="flex items-center justify-center rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-1.5 shadow-sm transition-all hover:shadow-md hover:border-bolt-elements-borderColorActive">
              <ThemeSwitch className="rounded-full p-0 text-bolt-elements-textSecondary transition-all hover:text-bolt-elements-textPrimary hover:scale-110 scale-75" />
            </div>
          </div>

          {/* Bottom Row: Auth Panel */}
          <div className="flex items-center justify-between animate-fadeIn">
            <HeaderUserPanel onRequestAuth={() => setAuthModalOpen(true)} />
          </div>
        </div>

        {/* Connection Status Banner */}
        {user && <ConnectionStatusBanner />}

        {/* Main Content */}
        <div className="flex h-full w-full flex-1 flex-col overflow-hidden text-[13px]">
          <div className="space-y-4 px-6 py-5">
            {/* New Chat Button - Primary CTA */}
            <div className="gradient-border rounded-xl p-[2px] shadow-md hover:shadow-xl transition-all animate-scaleIn">
              <Button
                asChild
                className="w-full justify-center bg-gradient-to-r from-primary/90 to-primary text-primary-foreground hover:from-primary hover:to-primary/90 btn-ripple transition-all hover:scale-[1.02] border-0 shadow-none active:scale-[0.98]"
                size="lg"
              >
                <a href="/" className="flex items-center gap-2.5 text-sm font-semibold text-primary-foreground">
                  <MessageSquarePlus className="h-5 w-5" />
                  Start new chat
                </a>
              </Button>
            </div>

            {/* Search Bar */}
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search conversations..." />

            {/* Quick Actions - Compact Grid */}
            <div className="grid grid-cols-2 gap-3 animate-slideInFromBottom">
              <div className="group relative overflow-hidden rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Button
                  variant="ghost"
                  className="w-full justify-center btn-ripple h-full py-4 hover:bg-transparent border-0"
                  size="md"
                  onClick={handleImportClick}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="h-5 w-5 text-bolt-elements-icon-primary transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-bolt-elements-textPrimary">Import</span>
                  </div>
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

              <div className="group relative overflow-hidden rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Button
                  variant="ghost"
                  className="w-full justify-center btn-ripple h-full py-4 hover:bg-transparent border-0"
                  size="md"
                  onClick={handleImportFolderClick}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <FolderUp className="h-5 w-5 text-bolt-elements-icon-primary transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-bolt-elements-textPrimary">Folder</span>
                  </div>
                </Button>
              </div>
              <input
                ref={dirInputRef}
                type="file"
                onChange={handleDirInputChange}
                className="hidden"
                {...({ webkitdirectory: '' } as any)}
              />

              <div className="group relative overflow-hidden rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Button
                  variant="ghost"
                  className="w-full justify-center btn-ripple h-full py-4 hover:bg-transparent border-0"
                  size="md"
                  onClick={() => setSettingsModalOpen(true)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Settings className="h-5 w-5 text-bolt-elements-icon-primary transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-bolt-elements-textPrimary">Settings</span>
                  </div>
                </Button>
              </div>

              {user && (
                <div className="group relative overflow-hidden rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-center btn-ripple h-full py-4 hover:bg-transparent border-0"
                    size="md"
                  >
                    <a href="/projects" className="flex flex-col items-center gap-1.5">
                      <FolderKanban className="h-5 w-5 text-bolt-elements-icon-primary transition-transform group-hover:scale-110" />
                      <span className="text-xs font-semibold text-bolt-elements-textPrimary">Projects</span>
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* History Section Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-bolt-elements-textTertiary">
              {searchQuery ? 'Search Results' : 'History'}
            </h3>
            {filteredList.length > 0 && (
              <span className="rounded-full bg-bolt-elements-background-depth-3 px-2.5 py-0.5 text-xs font-medium text-bolt-elements-textTertiary">
                {filteredList.length}
              </span>
            )}
          </div>

          <Separator />

          {/* History List */}
          <div className="relative flex-1 overflow-y-auto px-3 py-4">
            {isLoadingChats ? (
              <HistoryItemSkeleton count={8} />
            ) : filteredList.length === 0 ? (
              <div className="mx-2 mt-4 rounded-2xl border-2 border-dashed border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 py-8 text-center shadow-sm animate-scaleIn">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bolt-elements-background-depth-2 shadow-md">
                  <MessageSquarePlus className="h-7 w-7 text-bolt-elements-icon-primary" />
                </div>
                <p className="text-sm font-semibold text-bolt-elements-textPrimary">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="mt-2 text-xs text-bolt-elements-textSecondary leading-relaxed">
                  {searchQuery ? 'Try a different search term.' : 'Start a new chat to keep track of your progress.'}
                </p>
              </div>
            ) : (
              <DialogRoot open={dialogContent !== null}>
                {/* Favorites Section */}
                {favoriteChatsList.length > 0 && (
                  <div className="mb-4 space-y-1">
                    <div className="sticky top-0 z-[1] bg-gradient-to-b from-bolt-elements-background-depth-2 to-transparent px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-bolt-elements-textTertiary backdrop-blur-sm">
                      Favorites
                    </div>
                    {favoriteChatsList.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        isFavorite={true}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={() => setDialogContent({ type: 'delete', item })}
                        onUpdate={loadEntries}
                      />
                    ))}
                  </div>
                )}

                {/* Regular Chats - Grouped by Date */}
                {binDates(regularChatsList).map(({ category, items }) => (
                  <div key={category} className="mt-4 space-y-1 first:mt-0">
                    <div className="sticky top-0 z-[1] bg-gradient-to-b from-bolt-elements-background-depth-2 to-transparent px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-bolt-elements-textTertiary backdrop-blur-sm">
                      {category}
                    </div>
                    {items.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        isFavorite={false}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={() => setDialogContent({ type: 'delete', item })}
                        onUpdate={loadEntries}
                      />
                    ))}
                  </div>
                ))}

                {/* Delete Dialog */}
                <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                  {dialogContent?.type === 'delete' && (
                    <>
                      <DialogTitle>Delete Chat?</DialogTitle>
                      <DialogDescription asChild>
                        <div className="px-5 py-4 text-sm text-bolt-elements-textSecondary">
                          <p>
                            You are about to delete{' '}
                            <strong className="text-bolt-elements-textPrimary">{dialogContent.item.description}</strong>
                            .
                          </p>
                          <p className="mt-2">This action can't be undone.</p>
                        </div>
                      </DialogDescription>
                      <div className="flex justify-end gap-2 bg-bolt-elements-background-depth-2 px-5 pb-5">
                        <DialogButton type="secondary" onClick={closeDialog}>
                          Cancel
                        </DialogButton>
                        <DialogButton
                          type="danger"
                          onClick={(event) => {
                            deleteItem(event, dialogContent.item);
                            closeDialog();
                          }}
                        >
                          Delete
                        </DialogButton>
                      </div>
                    </>
                  )}
                </Dialog>
              </DialogRoot>
            )}
          </div>
        </div>
      </motion.div>
      {/* Import Preview Dialog */}
      <DialogRoot open={!!importPreview}>
        <Dialog onBackdrop={() => setImportPreview(null)} onClose={() => setImportPreview(null)}>
          {importPreview ? (
            <>
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription asChild>
                <div className="px-5 py-4 text-sm">
                  <div className="space-y-4">
                    {/* Project name */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-bolt-elements-textSecondary">
                        Project name
                      </label>
                      <Input
                        value={importOptions.title}
                        onChange={(e) => setImportOptions((o) => ({ ...o, title: e.target.value }))}
                        placeholder={importPreview.preview.rootName || 'Imported Project'}
                      />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-slideInFromBottom">
                      <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive transition-all">
                        <div className="text-xs font-medium text-bolt-elements-textSecondary">Total files</div>
                        <div className="text-lg font-bold text-bolt-elements-textPrimary mt-1">
                          {importPreview.preview.totalFiles}
                        </div>
                      </div>
                      <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive transition-all">
                        <div className="text-xs font-medium text-bolt-elements-textSecondary">Text files</div>
                        <div className="text-lg font-bold text-bolt-elements-textPrimary mt-1">
                          {importPreview.preview.textFiles}
                        </div>
                      </div>
                      <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive transition-all">
                        <div className="text-xs font-medium text-bolt-elements-textSecondary">Binary files</div>
                        <div className="text-lg font-bold text-bolt-elements-textPrimary mt-1">
                          {importPreview.preview.binaryFiles}
                        </div>
                      </div>
                      <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-center shadow-sm hover:shadow-md hover:border-bolt-elements-borderColorActive transition-all">
                        <div className="text-xs font-medium text-bolt-elements-textSecondary">Top-level files</div>
                        <div className="text-lg font-bold text-bolt-elements-textPrimary mt-1">
                          {importPreview.preview.topLevelFiles}
                        </div>
                      </div>
                    </div>

                    {/* Large folders warning */}
                    {(() => {
                      const stats = importPreview.preview.folderStats || [];
                      const large = stats.filter((s) => s.bytes > SIZE_WARNING_THRESHOLD).map((s) => s.name);

                      if (!large.length) {
                        return null;
                      }

                      return (
                        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-600">
                          ⚠ Some folders are large and may slow down import: {large.join(', ')}
                        </div>
                      );
                    })()}

                    {/* Detected framework and commands */}
                    {importPreview.preview.detected && (
                      <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 shadow-sm animate-scaleIn">
                        <div className="text-xs font-medium text-bolt-elements-textSecondary mb-2">
                          Detected Framework
                        </div>
                        <div className="text-sm font-bold text-bolt-elements-textPrimary flex items-center gap-2">
                          <span className="text-bolt-elements-icon-primary">
                            {importPreview.preview.detected.framework || 'JavaScript project'}
                          </span>
                          {importPreview.preview.detected.packageManager && (
                            <>
                              <span className="text-bolt-elements-textTertiary">•</span>
                              <span className="text-bolt-elements-textSecondary">
                                {importPreview.preview.detected.packageManager}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <div className="rounded-lg bg-bolt-elements-background-depth-3 p-2 border border-bolt-elements-borderColor">
                            <span className="font-medium text-bolt-elements-textSecondary">Install: </span>
                            <code className="text-bolt-elements-textPrimary font-mono">
                              {importPreview.preview.detected.installCmd}
                            </code>
                          </div>
                          <div className="rounded-lg bg-bolt-elements-background-depth-3 p-2 border border-bolt-elements-borderColor">
                            <span className="font-medium text-bolt-elements-textSecondary">Dev: </span>
                            <code className="text-bolt-elements-textPrimary font-mono">
                              {importPreview.preview.detected.devCmd}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Folder selection */}
                    {importPreview.preview.topLevelFolders.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-medium text-bolt-elements-textSecondary">Include folders</p>
                          <label className="flex items-center gap-2 text-xs">
                            <Checkbox
                              checked={importOptions.includeTopFiles}
                              onCheckedChange={(v: boolean | 'indeterminate') => setImportOptions((o) => ({ ...o, includeTopFiles: Boolean(v) }))}
                            />
                            Include top-level files
                          </label>
                        </div>
                        <div className="flex max-h-36 flex-wrap gap-2 overflow-auto rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 shadow-sm">
                          {importPreview.preview.topLevelFolders.map((f) => {
                            const checked = importOptions.selected[f] ?? true;
                            const stat = (importPreview.preview.folderStats || []).find((s) => s.name === f);
                            const isLarge = (stat?.bytes || 0) > SIZE_WARNING_THRESHOLD;

                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() =>
                                  setImportOptions((o) => ({ ...o, selected: { ...o.selected, [f]: !checked } }))
                                }
                                className={`select-none rounded-lg px-3 py-1.5 text-xs font-medium transition-all border hover:scale-[1.02] active:scale-95 ${
                                  checked
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive'
                                } ${isLarge ? 'ring-2 ring-yellow-500/50 ring-offset-1 ring-offset-bolt-elements-background-depth-2' : ''}`}
                                title={`${f}${stat ? ` (${formatBytes(stat.bytes)})` : ''}`}
                              >
                                {f}
                                {stat ? (
                                  <span className="ml-1.5 opacity-80 font-normal">{`(${formatBytes(stat.bytes)})`}</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Post-import actions */}
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium text-bolt-elements-textSecondary">Post-import actions</p>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={importOptions.runInstall}
                            onCheckedChange={(v: boolean | 'indeterminate') => setImportOptions((o) => ({ ...o, runInstall: Boolean(v) }))}
                          />
                          Run npm install (if package.json present)
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={importOptions.startDevServer}
                            onCheckedChange={(v: boolean | 'indeterminate') => setImportOptions((o) => ({ ...o, startDevServer: Boolean(v) }))}
                          />
                          Start dev server after import
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogDescription>
              <div className="flex justify-end gap-2 bg-bolt-elements-background-depth-2 px-5 pb-5">
                <DialogButton type="secondary" onClick={() => setImportPreview(null)}>
                  Cancel
                </DialogButton>
                <DialogButton
                  type="primary"
                  onClick={async () => {
                    if (!importPreview) {
                      return;
                    }

                    const title = importOptions.title || importPreview.preview.rootName || 'Imported Project';

                    const selectedFolders = Object.entries(importOptions.selected)
                      .filter(([, v]) => v)
                      .map(([k]) => k);
                    const filtered = Object.fromEntries(
                      Object.entries(importPreview.fileState).filter(([abs]) => {
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

                    const result = await persistImportedProject(
                      filtered,
                      title,
                      user?.id,
                      projectStore.get().currentProjectId ?? null,
                    );

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

                      setImportPreview(null);
                      await loadEntries();
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

      {/* Login Modal */}
      <LoginModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
}
