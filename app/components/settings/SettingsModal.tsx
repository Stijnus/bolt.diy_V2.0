import React from 'react';

import { SettingsContent } from './SettingsContent';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <Dialog className="max-w-[90vw] max-h-[90vh] w-full h-full" onClose={onClose}>
        <DialogTitle>Settings</DialogTitle>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <SettingsContent />
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
