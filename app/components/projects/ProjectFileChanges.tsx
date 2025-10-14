import { useStore } from '@nanostores/react';
import { FileEdit, AlertCircle, RotateCcw } from 'lucide-react';

import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Tooltip } from '~/components/ui/Tooltip';
import { workbenchStore } from '~/lib/stores/workbench';
import { cn } from '~/lib/utils';

interface ProjectFileChangesProps {
  className?: string;
  compact?: boolean;
}

export function ProjectFileChanges({ className, compact = false }: ProjectFileChangesProps) {
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const currentProjectId = useStore(workbenchStore.currentProjectId);

  const unsavedCount = unsavedFiles.size;

  const handleDiscardChanges = () => {
    const previousSelected = workbenchStore.selectedFile.get();

    for (const filePath of unsavedFiles) {
      workbenchStore.setSelectedFile(filePath);
      workbenchStore.resetCurrentDocument();
    }

    workbenchStore.setSelectedFile(previousSelected);
  };

  if (!currentProjectId || unsavedCount === 0) {
    return null;
  }

  if (compact) {
    return (
      <Tooltip content={`${unsavedCount} file${unsavedCount === 1 ? '' : 's'} with unsaved changes`} side="bottom">
        <Badge
          variant="outline"
          className={cn('gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400', className)}
        >
          <FileEdit className="h-3 w-3" />
          <span className="font-medium">{unsavedCount}</span>
        </Badge>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2',
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {unsavedCount} unsaved file{unsavedCount === 1 ? '' : 's'}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300">Changes will be auto-saved to your project</p>
      </div>
      <Tooltip content="Discard all changes" side="left">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDiscardChanges}
          className="gap-1.5 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="text-xs">Discard</span>
        </Button>
      </Tooltip>
    </div>
  );
}
