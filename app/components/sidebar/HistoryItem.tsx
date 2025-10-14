import { useLocation, useNavigate } from '@remix-run/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ChatActionsMenu } from './ChatActionsMenu';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { Tooltip } from '~/components/ui/Tooltip';
import { useAuth } from '~/lib/contexts/AuthContext';
import { type ChatHistoryItem } from '~/lib/persistence';
import { exportChatToJSON, renameChatDescription, duplicateChat } from '~/lib/persistence/chat-actions';
import { cn } from '~/lib/utils';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
  onUpdate?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function HistoryItem({ item, onDelete, onUpdate, isFavorite = false, onToggleFavorite }: HistoryItemProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check if this chat is currently active
  const isActive = location.pathname === `/chat/${item.urlId}`;

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  // Extract model info (simple display of model string if available)
  const modelDisplay = item.model ? item.model.split(':')[1] || item.model : null;

  const handleExport = () => {
    exportChatToJSON(item.id);
  };

  const handleRename = () => {
    setNewDescription(item.description || '');
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async () => {
    const success = await renameChatDescription(item.id, newDescription, user?.id);

    if (success) {
      setShowRenameDialog(false);
      onUpdate?.();
    }
  };

  const handleDuplicate = async () => {
    const result = await duplicateChat(item.id, user?.id);

    if (result.success && result.chatId) {
      onUpdate?.();
      navigate(`/chat/${result.chatId}`);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(item.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a
          href={`/chat/${item.urlId}`}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all duration-200',
            isActive
              ? 'border-bolt-elements-button-primary-background/40 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary shadow-lg ring-2 ring-bolt-elements-button-primary-background/30'
              : 'border-transparent bg-bolt-elements-background-depth-1/50 text-bolt-elements-textSecondary hover:border-bolt-elements-borderColor/60 hover:bg-bolt-elements-background-depth-1 hover:text-bolt-elements-textPrimary hover:shadow-md hover:scale-[1.01]',
          )}
        >
          {/* Icon */}
          <MessageSquare
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-colors',
              isActive
                ? 'text-bolt-elements-button-primary-background'
                : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-icon-primary',
            )}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <Tooltip content={item.description || item.urlId} side="right" delayDuration={300}>
              <div className="truncate font-semibold text-[13px] leading-snug">{item.description || item.urlId}</div>
            </Tooltip>
            {/* Metadata row */}
            <div className="mt-1 flex items-center gap-2 text-[11px] text-bolt-elements-textTertiary">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{timeAgo}</span>
              </span>
              {modelDisplay && (
                <>
                  <span className="text-bolt-elements-borderColor/50">•</span>
                  <span className="flex items-center gap-1 rounded-md bg-bolt-elements-background-depth-3/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ring-1 ring-bolt-elements-borderColor/20">
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{modelDisplay}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                  isFavorite
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-bolt-elements-textTertiary opacity-0 group-hover:opacity-100 hover:bg-bolt-elements-background-depth-3 hover:text-yellow-500',
                )}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              </button>
            )}

            {/* Actions menu - only visible on hover or when menu is open */}
            <div className={cn('transition-opacity', isHovered || isActive ? 'opacity-100' : 'opacity-0')}>
              <ChatActionsMenu
                item={item}
                onExport={handleExport}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={() => onDelete?.({} as React.UIEvent)}
              />
            </div>
          </div>
        </a>
      </motion.div>

      <DialogRoot open={showRenameDialog}>
        <Dialog onBackdrop={() => setShowRenameDialog(false)} onClose={() => setShowRenameDialog(false)}>
          <DialogTitle>Rename Chat</DialogTitle>
          <DialogDescription className="px-5 py-4">
            <Input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Enter chat name"
              maxLength={100}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm();
                }
              }}
            />
          </DialogDescription>
          <div className="flex justify-end gap-2 bg-bolt-elements-background-depth-2 px-5 pb-5">
            <DialogButton type="secondary" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </DialogButton>
            <DialogButton type="primary" onClick={handleRenameConfirm}>
              Rename
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
