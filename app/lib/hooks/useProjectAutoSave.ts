import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { projectService, type FileState } from '~/lib/services/projects';
import { workbenchStore } from '~/lib/stores/workbench';
import { encodeFileContent } from '~/utils/file-encoding';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ProjectAutoSave');

const AUTO_SAVE_INTERVAL = 30000;
const DEBOUNCE_DELAY = 5000;
const MAX_PROJECT_SIZE = 5 * 1024 * 1024;
const IGNORED_PATH_SNIPPETS = ['node_modules/', 'dist/', 'build/', '.next/', '.turbo/', '.vercel/', '.git/'];

interface UseProjectAutoSaveOptions {
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook that automatically saves workbench files to the active project
 * Debounces saves and only saves when there's an active project
 */
export function useProjectAutoSave(options: UseProjectAutoSaveOptions = {}) {
  const { enabled = true, onSaveSuccess, onSaveError } = options;

  const files = useStore(workbenchStore.files);
  const currentProjectId = useStore(workbenchStore.currentProjectId);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  const saveProjectFiles = async (projectId: string) => {
    if (isSavingRef.current) {
      logger.debug('Save already in progress, skipping');
      return;
    }

    try {
      isSavingRef.current = true;

      const fileEntries = Object.entries(files);

      if (fileEntries.length === 0) {
        logger.debug('No files to save');
        return;
      }

      // Convert workbench files to FileState format
      const fileState: FileState = {};

      for (const [path, fileData] of fileEntries) {
        if (fileData?.type === 'file' && !IGNORED_PATH_SNIPPETS.some((snippet) => path.includes(snippet))) {
          const isBinary = fileData.isBinary || false;

          // Encode content if binary
          const encoded = encodeFileContent(fileData.content, isBinary);

          fileState[path] = {
            content: encoded.content,
            isBinary,
            encoding: encoded.encoding,
          };
        }
      }

      const fileCount = Object.keys(fileState).length;

      if (fileCount === 0) {
        logger.debug('No valid files to save');
        return;
      }

      const estimatedSize = new TextEncoder().encode(JSON.stringify(fileState)).length;

      if (estimatedSize > MAX_PROJECT_SIZE) {
        const error = new Error('Project files exceed Supabase row limit (5MB). Remove large artifacts and try again.');
        toast.error(error.message);

        if (onSaveError) {
          onSaveError(error);
        }

        return;
      }

      logger.info(`Auto-saving ${fileCount} files to project ${projectId}`);

      await projectService.saveProjectFiles(projectId, fileState);

      const saveTime = Date.now();
      lastSaveRef.current = saveTime;
      setLastSaveTimeState(saveTime);

      logger.info(`Successfully auto-saved ${fileCount} files`);

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      logger.error('Failed to auto-save project files:', error);

      if (onSaveError) {
        onSaveError(error as Error);
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  // Debounced save on file changes
  useEffect(() => {
    const clearTimeoutIfNeeded = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };

    if (!enabled || !currentProjectId) {
      clearTimeoutIfNeeded();
      return clearTimeoutIfNeeded;
    }

    clearTimeoutIfNeeded();

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current;

      // Only save if it's been at least 5 seconds since last save
      if (timeSinceLastSave >= DEBOUNCE_DELAY) {
        saveProjectFiles(currentProjectId).catch((error) => {
          logger.error('Debounced save failed:', error);
        });
      }
    }, DEBOUNCE_DELAY);

    return clearTimeoutIfNeeded;
  }, [files, currentProjectId, enabled]);

  // Periodic save interval (every 30 seconds)
  useEffect(() => {
    const clearIntervalIfNeeded = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!enabled || !currentProjectId) {
      clearIntervalIfNeeded();
      return clearIntervalIfNeeded;
    }

    clearIntervalIfNeeded();

    intervalRef.current = setInterval(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current;

      // Only save if it's been at least 30 seconds since last save
      if (timeSinceLastSave >= AUTO_SAVE_INTERVAL) {
        saveProjectFiles(currentProjectId).catch((error) => {
          logger.error('Interval save failed:', error);
        });
      }
    }, AUTO_SAVE_INTERVAL);

    return clearIntervalIfNeeded;
  }, [currentProjectId, enabled]);

  // Save on unmount/page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentProjectId) {
        saveProjectFiles(currentProjectId).catch((error) => {
          logger.error('Beforeunload save failed:', error);
        });
      }
    };

    if (!enabled || !currentProjectId) {
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (currentProjectId) {
        saveProjectFiles(currentProjectId).catch((error) => {
          logger.error('Unmount save failed:', error);
        });
      }
    };
  }, [currentProjectId, enabled]);

  // Manual save function
  const saveNow = async () => {
    if (!currentProjectId) {
      throw new Error('No active project');
    }

    await saveProjectFiles(currentProjectId);
  };

  // Create a reactive state for last save time
  const [lastSaveTimeState, setLastSaveTimeState] = useState(lastSaveRef.current);

  // Update state when save happens
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSaveTimeState(lastSaveRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    saveNow,
    lastSaveTime: lastSaveTimeState,
    isSaving: isSavingRef.current,
  };
}
