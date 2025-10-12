import { useNavigate } from '@remix-run/react';
import { motion, type Variants } from 'framer-motion';
import { MessageSquarePlus, FolderKanban, Upload, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { HistoryItem } from './HistoryItem';
import { UserPanel } from './UserPanel';
import { binDates } from './date-binning';

import { LoginModal } from '~/components/auth/LoginModal';
import { Button } from '~/components/ui/Button';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Separator } from '~/components/ui/Separator';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
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
import { importChatFromJSON } from '~/lib/persistence/chat-actions';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { createClient } from '~/lib/supabase/client';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';

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
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const [database, setDatabase] = useState<IDBDatabase | undefined>(undefined);
  const navigate = useNavigate();

  const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

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
        remoteChats = (data ?? [])
          .filter((chat: any) => {
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
          .map((chat: any) => ({
            id: chat.url_id,
            urlId: chat.url_id,
            description: chat.description ?? chat.url_id,
            messages: (chat.messages ?? []) as ChatHistoryItem['messages'],
            timestamp: chat.updated_at ?? new Date().toISOString(),
            model: (chat as { model?: string }).model ?? undefined,
            origin: 'remote' as const,
            fileState: (chat as { file_state?: any })?.file_state ?? undefined,
          }));

        if (database) {
          await Promise.all(
            remoteChats.map((chat) =>
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
              ),
            ),
          );
        }
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
            description: item.description ?? item.urlId,
            origin: item.origin ?? 'local',
          }));

        if (!user) {
          const remoteOnly = normalized.filter((item) => item.origin === 'remote');

          if (remoteOnly.length > 0) {
            await Promise.all(remoteOnly.map((item) => deleteById(database, item.id).catch(() => void 0)));
          }
        } else {
          // For logged-in users, clean up local entries to avoid duplicates
          const localOnly = normalized.filter((item) => item.origin === 'local');

          if (localOnly.length > 0) {
            logger.info(`Cleaning up ${localOnly.length} local IndexedDB entries for logged-in user`);
            await Promise.all(localOnly.map((item) => deleteById(database, item.id).catch(() => void 0)));
          }
        }

        const filtered = user
          ? normalized.filter((item) => item.origin === 'remote')
          : normalized.filter((item) => item.origin !== 'remote');

        setList(filtered);
      } else {
        setList(remoteChats);
      }
    } catch (error: any) {
      toast.error('Failed to load conversations');
      logger.error(error);
    }
  }, [database, user]);

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

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

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
        <div className="border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/95 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 shadow-inner shadow-black/5">
                <MessageSquarePlus className="h-5 w-5 text-bolt-elements-icon-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-bolt-elements-textPrimary">Conversations</h2>
                <p className="text-[11px] text-bolt-elements-textSecondary">Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-bolt-elements-borderColor/80 bg-bolt-elements-background-depth-2/80 px-1.5 py-1.5 shadow-sm">
              <div className="flex items-center justify-center rounded-full bg-bolt-elements-background-depth-1/70 p-1.5 shadow-inner">
                <ThemeSwitch className="rounded-full p-0 text-bolt-elements-textSecondary transition-colors hover:text-bolt-elements-textPrimary" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-bolt-elements-background-depth-1/80 px-2.5 py-1 text-[11px] font-semibold text-bolt-elements-icon-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bolt-elements-icon-success"></span>
                Live
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-full w-full flex-1 flex-col overflow-hidden text-[13px]">
          <div className="space-y-4 px-6 py-5">
            {/* New Chat Button */}
            <Button
              asChild
              className="w-full justify-center shadow-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg btn-ripple transition-smooth hover:scale-[1.02]"
              size="lg"
            >
              <a href="/" className="flex items-center gap-2.5 text-sm font-semibold">
                <MessageSquarePlus className="h-5 w-5" />
                Start new chat
              </a>
            </Button>

            {/* Import Chat Button */}
            <Button
              variant="outline"
              className="w-full justify-center shadow-sm hover:shadow-md border-bolt-elements-borderColor btn-ripple transition-smooth hover:scale-[1.02]"
              size="lg"
              onClick={handleImportClick}
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-semibold">Import Chat</span>
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

            {/* Settings Button */}
            <Button
              asChild
              variant="outline"
              className="w-full justify-center shadow-sm hover:shadow-md border-bolt-elements-borderColor btn-ripple transition-smooth hover:scale-[1.02]"
              size="lg"
            >
              <a href="/settings" className="flex items-center gap-2.5 text-sm font-semibold">
                <Settings className="h-5 w-5" />
                Settings
              </a>
            </Button>

            {/* My Projects Button */}
            {user ? (
              <Button
                asChild
                variant="outline"
                className="w-full justify-center shadow-sm hover:shadow-md border-bolt-elements-borderColor btn-ripple transition-smooth hover:scale-[1.02]"
                size="lg"
              >
                <a href="/projects" className="flex items-center gap-2.5 text-sm font-semibold">
                  <FolderKanban className="h-5 w-5" />
                  My Projects
                </a>
              </Button>
            ) : null}
          </div>

          {/* History Section Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-bolt-elements-textTertiary">
              History
            </h3>
            {list.length > 0 && (
              <span className="rounded-full bg-bolt-elements-background-depth-3 px-2 py-0.5 text-xs font-medium text-bolt-elements-textTertiary">
                {list.length}
              </span>
            )}
          </div>

          <Separator />

          {/* History List */}
          <div className="relative flex-1 overflow-y-auto px-3 py-4">
            {list.length === 0 ? (
              <div className="mx-2 mt-4 rounded-2xl border border-dashed border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-1/50 px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-bolt-elements-background-depth-3">
                  <MessageSquarePlus className="h-6 w-6 text-bolt-elements-textTertiary" />
                </div>
                <p className="text-sm font-medium text-bolt-elements-textPrimary">No conversations yet</p>
                <p className="mt-1 text-xs text-bolt-elements-textSecondary">
                  Start a new chat to keep track of your progress.
                </p>
              </div>
            ) : null}
            <DialogRoot open={dialogContent !== null}>
              {binDates(list).map(({ category, items }) => (
                <div key={category} className="mt-4 space-y-1 first:mt-0">
                  <div className="sticky top-0 z-[1] bg-gradient-to-b from-bolt-elements-background-depth-2 to-transparent px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-bolt-elements-textTertiary backdrop-blur-sm">
                    {category}
                  </div>
                  {items.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onDelete={() => setDialogContent({ type: 'delete', item })}
                      onUpdate={loadEntries}
                    />
                  ))}
                </div>
              ))}
              <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                {dialogContent?.type === 'delete' && (
                  <>
                    <DialogTitle>Delete Chat?</DialogTitle>
                    <DialogDescription className="px-5 py-4 text-sm text-bolt-elements-textSecondary">
                      <p>
                        You are about to delete{' '}
                        <strong className="text-bolt-elements-textPrimary">{dialogContent.item.description}</strong>.
                      </p>
                      <p className="mt-2">This action can't be undone.</p>
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
          </div>

          <UserPanel
            onRequestAuth={() => {
              setAuthModalOpen(true);
              setOpen(true);
            }}
          />
        </div>
      </motion.div>
      <LoginModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
