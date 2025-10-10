/**
 * Event-based synchronization helpers
 * Replaces arbitrary timeouts with proper event-based waiting
 */

import { createScopedLogger } from './logger';

const logger = createScopedLogger('SyncHelpers');

/**
 * Wait for a condition to become true with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50, timeoutMessage = 'Condition timeout' } = options;

  const startTime = Date.now();

  while (true) {
    const result = await Promise.resolve(condition());

    if (result) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(timeoutMessage);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for file operations to settle by observing store changes
 * More robust than arbitrary timeouts
 *
 * This function monitors the workbench store's file map and waits until:
 * 1. The file count stabilizes (no changes for `stabilityDelay` ms)
 * 2. The timeout is reached (fallback)
 *
 * Use this before capturing file state to ensure WebContainer file writes
 * have completed and the store has refreshed with the latest file tree.
 */
export async function waitForFileOperations(
  workbenchStore: { files: { get: () => Record<string, any> } },
  options: {
    timeout?: number;
    stabilityDelay?: number;
  } = {},
): Promise<void> {
  const { timeout = 2000, stabilityDelay = 150 } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();
    let lastChangeTime = Date.now();
    let previousFileCount = Object.keys(workbenchStore.files.get()).length;

    const checkStability = () => {
      const now = Date.now();
      const currentFiles = workbenchStore.files.get();
      const currentFileCount = Object.keys(currentFiles).length;
      const elapsed = now - startTime;
      const timeSinceLastChange = now - lastChangeTime;

      // Check if file count changed
      if (currentFileCount !== previousFileCount) {
        logger.info(
          `[${elapsed}ms] File count changed: ${previousFileCount} → ${currentFileCount} (waiting for stability...)`,
        );
        lastChangeTime = now;
        previousFileCount = currentFileCount;
      }

      // Check timeout
      if (elapsed > timeout) {
        logger.warn(
          `[${elapsed}ms] File operations wait TIMED OUT after ${timeout}ms with ${currentFileCount} files, proceeding anyway`,
        );
        resolve();
        return;
      }

      // Check if stable (no changes for stabilityDelay)
      if (timeSinceLastChange >= stabilityDelay) {
        logger.info(
          `[${elapsed}ms] File operations STABLE after ${timeSinceLastChange}ms of no changes (${currentFileCount} files captured)`,
        );
        resolve();
        return;
      }

      // Log progress periodically
      if (elapsed % 500 === 0) {
        logger.debug(
          `[${elapsed}ms] Still waiting... ${currentFileCount} files, ${timeSinceLastChange}ms since last change`,
        );
      }

      // Continue checking
      setTimeout(checkStability, 25);
    };

    checkStability();
  });
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
