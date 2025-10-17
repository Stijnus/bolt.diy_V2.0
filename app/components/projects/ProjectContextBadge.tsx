import { useStore } from '@nanostores/react';
import { FolderKanban, Save, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ProjectFileChanges } from './ProjectFileChanges';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Tooltip } from '~/components/ui/Tooltip';
import { projectService } from '~/lib/services/projects';
import type { FileState } from '~/lib/services/projects';
import { getCurrentProject } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';
import { cn } from '~/lib/utils';
import { encodeFileContent } from '~/utils/file-encoding';

interface ProjectContextBadgeProps {
  lastAutoSaveTime?: number;
  onManualSave?: () => Promise<void>;
}

export function ProjectContextBadge({ lastAutoSaveTime = 0, onManualSave }: ProjectContextBadgeProps) {
  const currentProject = getCurrentProject();
  const currentProjectId = useStore(workbenchStore.currentProjectId);
  const files = useStore(workbenchStore.files);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveText, setLastSaveText] = useState('Never');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update last save text
  useEffect(() => {
    if (!lastAutoSaveTime) {
      setLastSaveText('Never');

      return () => {
        // no interval to clear
      };
    }

    const updateText = () => {
      const now = Date.now();
      const diff = now - lastAutoSaveTime;

      if (diff < 5000) {
        setLastSaveText('Just now');
      } else if (diff < 60000) {
        setLastSaveText(`${Math.floor(diff / 1000)}s ago`);
      } else if (diff < 3600000) {
        setLastSaveText(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setLastSaveText(`${Math.floor(diff / 3600000)}h ago`);
      }
    };

    updateText();

    const interval = setInterval(updateText, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [lastAutoSaveTime]);

  const handleManualSave = useCallback(async () => {
    if (!currentProjectId) {
      toast.error('No active project');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      if (onManualSave) {
        // Use the provided save function from the hook
        await onManualSave();
      } else {
        // Fallback to direct save
        const fileEntries = Object.entries(files);
        const fileState: FileState = {};

        for (const [path, fileData] of fileEntries) {
          if (fileData?.type === 'file') {
            const isBinary = fileData.isBinary || false;
            const encoded = encodeFileContent(fileData.content, isBinary);

            fileState[path] = {
              content: encoded.content,
              isBinary,
              encoding: encoded.encoding,
            };
          }
        }

        await projectService.saveProjectFiles(currentProjectId, fileState);
      }

      setSaveStatus('saved');
      toast.success('Project saved successfully');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      setSaveStatus('error');
      toast.error(`Failed to save project: ${error.message}`);

      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, files, onManualSave]);

  // Add keyboard shortcut for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  if (!currentProject && !currentProjectId) {
    return null;
  }

  const projectName = currentProject?.name || 'Unknown Project';
  const fileCount = Object.entries(files).filter(([_, f]) => f?.type === 'file').length;

  const getSaveIcon = () => {
    switch (saveStatus) {
      case 'saving': {
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      }
      case 'saved': {
        return <CheckCircle2 className="h-3.5 w-3.5 text-bolt-elements-button-success-text" />;
      }
      case 'error': {
        return <AlertCircle className="h-3.5 w-3.5 text-bolt-elements-button-danger-text" />;
      }
      default: {
        return <Save className="h-3.5 w-3.5" />;
      }
    }
  };

  const getSaveButtonClass = () => {
    switch (saveStatus) {
      case 'saved': {
        return 'bg-bolt-elements-button-success-background text-bolt-elements-button-success-text hover:bg-bolt-elements-button-success-backgroundHover border-bolt-elements-button-success-background';
      }
      case 'error': {
        return 'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover border-bolt-elements-button-danger-background';
      }
      default: {
        return '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Project Badge */}
      <Badge
        variant="default"
        className={cn(
          'gap-2 border-2 shadow-sm transition-all duration-200',
          'bg-bolt-elements-background-depth-2',
          'border-bolt-elements-borderColorActive/50',
          'hover:border-bolt-elements-borderColorActive',
          'hover:shadow-md',
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-bolt-elements-button-primary-background">
          <FolderKanban className="h-3.5 w-3.5 text-bolt-elements-icon-primary" />
        </div>
        <span className="font-semibold text-bolt-elements-textPrimary">{projectName}</span>
        <span className="text-bolt-elements-textTertiary">•</span>
        <span className="text-xs font-medium text-bolt-elements-textSecondary">{fileCount} files</span>
      </Badge>

      {/* Unsaved Files Indicator */}
      <ProjectFileChanges compact />

      {/* Last Saved Indicator */}
      <Tooltip
        content={
          lastAutoSaveTime
            ? `Last auto-saved: ${new Date(lastAutoSaveTime).toLocaleString()}`
            : 'Not yet saved to project'
        }
        side="bottom"
      >
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
            'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/60',
            lastAutoSaveTime ? 'text-bolt-elements-textSecondary' : 'text-bolt-elements-textTertiary border-dashed',
          )}
        >
          <Clock className="h-3 w-3" />
          <span>{lastSaveText}</span>
        </div>
      </Tooltip>

      {/* Manual Save Button */}
      <Tooltip content="Save project now (Ctrl+S)" side="bottom">
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSave}
          disabled={isSaving || saveStatus === 'saving'}
          className={cn('gap-1.5 h-8 transition-all', getSaveButtonClass())}
        >
          {getSaveIcon()}
          <span className="text-xs font-medium">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Failed'}
            {saveStatus === 'idle' && 'Save'}
          </span>
        </Button>
      </Tooltip>
    </div>
  );
}
