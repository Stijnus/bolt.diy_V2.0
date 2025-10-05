import { motion, type Variants } from 'framer-motion';
import { MessageSquarePlus, FolderKanban } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { HistoryItem } from './HistoryItem';
import { UserPanel } from './UserPanel';
import { binDates } from './date-binning';

import { Button } from '~/components/ui/Button';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Separator } from '~/components/ui/Separator';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { useAuth } from '~/lib/contexts/AuthContext';
import { db, deleteById, getAll, chatId, type ChatHistoryItem } from '~/lib/persistence';
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
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const { user } = useAuth();

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    if (db) {
      deleteById(db, item.id)
        .then(() => {
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    }
  }, []);

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

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
    <motion.div
      ref={menuRef}
      initial="closed"
      animate={open ? 'open' : 'closed'}
      variants={menuVariants}
      className="side-menu pointer-events-auto fixed top-0 z-[997] flex h-full w-[360px] flex-col border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-2xl"
    >
      {/* Header */}
      <div className="border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Conversations</h2>
              <p className="text-xs text-bolt-elements-textSecondary">Workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors" />
            <div className="flex items-center gap-2 rounded-full border border-bolt-elements-icon-success/30 bg-bolt-elements-icon-success/10 px-3 py-1.5 text-xs font-semibold text-bolt-elements-icon-success">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-bolt-elements-icon-success"></div>
              Live
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        <div className="space-y-4 px-6 py-5">
          {/* New Chat Button */}
          <Button
            asChild
            className="w-full justify-center shadow-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
            size="lg"
          >
            <a href="/" className="flex items-center gap-2.5 font-semibold">
              <MessageSquarePlus className="h-5 w-5" />
              Start new chat
            </a>
          </Button>

          {/* My Projects Button */}
          {user ? (
            <Button
              asChild
              variant="outline"
              className="w-full justify-center shadow-sm hover:shadow-md border-bolt-elements-borderColor"
              size="lg"
            >
              <a href="/projects" className="flex items-center gap-2.5 font-semibold">
                <FolderKanban className="h-5 w-5" />
                My Projects
              </a>
            </Button>
          ) : null}

        </div>

        {/* History Section Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-bolt-elements-textTertiary">History</h3>
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
                  <HistoryItem key={item.id} item={item} onDelete={() => setDialogContent({ type: 'delete', item })} />
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

        <UserPanel />
      </div>
    </motion.div>
  );
}
