import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      // Don't trigger shortcuts when typing in inputs (except specifically handled ones)
      const target = event.target as HTMLElement;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();

        // Special handling for Escape - always allow
        const allowInInput = shortcut.key === 'Escape' || shortcut.key === 'Enter';

        if (metaMatch && ctrlMatch && shiftMatch && altMatch && keyMatch) {
          if (isInput && !allowInInput) {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          shortcut.action();
          break;
        }
      }
    },
    [enabled, shortcuts],
  );

  useEffect(() => {
    if (!enabled) {
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { shortcuts };
}

// Predefined shortcut helpers
export const createShortcut = (
  key: string,
  action: () => void,
  options?: {
    meta?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description?: string;
    preventDefault?: boolean;
  },
): KeyboardShortcut => ({
  key,
  metaKey: options?.meta,
  ctrlKey: options?.ctrl,
  shiftKey: options?.shift,
  altKey: options?.alt,
  action,
  description: options?.description,
  preventDefault: options?.preventDefault,
});

// Common shortcuts
export const shortcuts = {
  toggleSidebar: (action: () => void) =>
    createShortcut('b', action, {
      meta: true,
      ctrl: true,
      description: 'Toggle sidebar',
    }),
  search: (action: () => void) =>
    createShortcut('k', action, {
      meta: true,
      ctrl: true,
      description: 'Search conversations',
    }),
  newChat: (action: () => void) =>
    createShortcut('n', action, {
      meta: true,
      ctrl: true,
      description: 'New chat',
    }),
  escape: (action: () => void) =>
    createShortcut('Escape', action, {
      description: 'Close/Cancel',
      preventDefault: false,
    }),
  navigateUp: (action: () => void) =>
    createShortcut('ArrowUp', action, {
      description: 'Navigate up',
    }),
  navigateDown: (action: () => void) =>
    createShortcut('ArrowDown', action, {
      description: 'Navigate down',
    }),
  enter: (action: () => void) =>
    createShortcut('Enter', action, {
      description: 'Select/Open',
      preventDefault: false,
    }),
};
