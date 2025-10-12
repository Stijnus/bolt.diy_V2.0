import { useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ChatActionsMenu } from './ChatActionsMenu';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { useAuth } from '~/lib/contexts/AuthContext';
import { type ChatHistoryItem } from '~/lib/persistence';
import { exportChatToJSON, renameChatDescription, duplicateChat } from '~/lib/persistence/chat-actions';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
  onUpdate?: () => void;
}

export function HistoryItem({ item, onDelete, onUpdate }: HistoryItemProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group relative"
      >
        <a
          href={`/chat/${item.urlId}`}
          className="flex items-center gap-3 rounded-xl border border-transparent bg-bolt-elements-background-depth-1/50 px-3 py-2.5 text-sm text-bolt-elements-textSecondary transition-all hover:border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1 hover:text-bolt-elements-textPrimary hover:shadow-sm"
        >
          <MessageSquare className="h-4 w-4 flex-shrink-0 text-bolt-elements-textTertiary transition-colors group-hover:text-bolt-elements-icon-primary" />
          <span className="min-w-0 flex-1 truncate">{item.description || item.urlId}</span>
          {/* TEMP: Always visible for debugging */}
          <div className="ml-auto">
            <ChatActionsMenu
              item={item}
              onExport={handleExport}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={() => onDelete?.({} as React.UIEvent)}
            />
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
