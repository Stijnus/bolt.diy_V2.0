import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/DropdownMenu';

interface MessageActionMenuProps {
  messageIndex: number;
  onRevert: () => void;
}

export function MessageActionMenu({ messageIndex: _messageIndex, onRevert }: MessageActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const handleRevertClick = () => {
    setOpen(false);
    setShowRevertDialog(true);
  };

  const handleRevertConfirm = () => {
    setShowRevertDialog(false);
    onRevert();
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg text-bolt-elements-textTertiary transition-all hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
            aria-label="Message actions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 z-[9999]">
          <DropdownMenuItem onClick={handleRevertClick}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Revert to here</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogRoot open={showRevertDialog}>
        <Dialog onBackdrop={() => setShowRevertDialog(false)} onClose={() => setShowRevertDialog(false)}>
          <DialogTitle>Revert Messages?</DialogTitle>
          <DialogDescription className="px-5 py-4 text-sm text-bolt-elements-textSecondary">
            <p>This will remove all messages after this point in the conversation. This action cannot be undone.</p>
            <p className="mt-2">Are you sure you want to continue?</p>
          </DialogDescription>
          <div className="flex justify-end gap-2 bg-bolt-elements-background-depth-2 px-5 pb-5">
            <DialogButton type="secondary" onClick={() => setShowRevertDialog(false)}>
              Cancel
            </DialogButton>
            <DialogButton type="danger" onClick={handleRevertConfirm}>
              Revert
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
