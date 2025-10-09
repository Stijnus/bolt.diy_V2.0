import type { WebContainer } from '@webcontainer/api';
import { webcontainer, webcontainerContext } from './index';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebContainerUtils');

export interface WebContainerReadinessOptions {
  /**
   * Maximum time to wait for WebContainer to be ready (in milliseconds)
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Interval to check WebContainer status (in milliseconds)
   * @default 100
   */
  checkInterval?: number;

  /**
   * Whether to throw an error if WebContainer fails to initialize
   * @default true
   */
  throwOnTimeout?: boolean;
}

export interface WebContainerReadinessResult {
  ready: boolean;
  container?: WebContainer;
  error?: Error;
  timeWaited: number;
}

/**
 * Waits for WebContainer to be fully initialized and ready
 *
 * This function checks the webcontainerContext.loaded flag and waits for
 * the webcontainer promise to resolve. It's essential to call this before
 * attempting any filesystem operations.
 *
 * @param options Configuration options for the readiness check
 * @returns Promise resolving to the readiness result
 *
 * @example
 * ```typescript
 * const result = await waitForWebContainer();
 * if (result.ready && result.container) {
 *   // Safe to use WebContainer
 *   await result.container.fs.writeFile('test.txt', 'content');
 * } else {
 *   console.error('WebContainer not ready:', result.error);
 * }
 * ```
 */
export async function waitForWebContainer(
  options: WebContainerReadinessOptions = {},
): Promise<WebContainerReadinessResult> {
  const { timeout = 30000, checkInterval = 100, throwOnTimeout = true } = options;

  const startTime = Date.now();

  logger.debug('Waiting for WebContainer to be ready...');

  // Quick check: if already loaded, return immediately
  if (webcontainerContext.loaded) {
    try {
      const container = await Promise.race([
        webcontainer,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('WebContainer promise timeout')), 5000),
        ),
      ]);

      logger.debug('WebContainer already loaded and ready');

      return {
        ready: true,
        container,
        timeWaited: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('WebContainer loaded flag set but promise failed:', error);

      const errorObj = error instanceof Error ? error : new Error(String(error));

      return {
        ready: false,
        error: errorObj,
        timeWaited: Date.now() - startTime,
      };
    }
  }

  // Wait for WebContainer to load
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      clearInterval(checkIntervalId);

      const timeWaited = Date.now() - startTime;
      const error = new Error(`WebContainer failed to initialize within ${timeout}ms`);

      logger.error(error.message, { timeWaited });

      if (throwOnTimeout) {
        resolve({
          ready: false,
          error,
          timeWaited,
        });
      } else {
        resolve({
          ready: false,
          error,
          timeWaited,
        });
      }
    }, timeout);

    const checkIntervalId = setInterval(async () => {
      if (webcontainerContext.loaded) {
        clearInterval(checkIntervalId);
        clearTimeout(timeoutId);

        try {
          const container = await Promise.race([
            webcontainer,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('WebContainer promise timeout')), 5000),
            ),
          ]);

          const timeWaited = Date.now() - startTime;

          logger.info(`WebContainer ready after ${timeWaited}ms`);

          resolve({
            ready: true,
            container,
            timeWaited,
          });
        } catch (error) {
          const timeWaited = Date.now() - startTime;
          const errorObj = error instanceof Error ? error : new Error(String(error));

          logger.error('WebContainer promise failed after loaded flag set:', error);

          resolve({
            ready: false,
            error: errorObj,
            timeWaited,
          });
        }
      }
    }, checkInterval);
  });
}

/**
 * Checks if WebContainer is currently ready (synchronous check)
 *
 * @returns true if WebContainer is loaded, false otherwise
 */
export function isWebContainerReady(): boolean {
  return webcontainerContext.loaded;
}

/**
 * Gets the WebContainer instance if it's ready, or waits for it with a timeout
 *
 * @param timeoutMs Maximum time to wait in milliseconds (default: 10000)
 * @returns The WebContainer instance or throws an error
 * @throws Error if WebContainer is not ready within the timeout
 */
export async function getWebContainerInstance(timeoutMs: number = 10000): Promise<WebContainer> {
  const result = await waitForWebContainer({ timeout: timeoutMs, throwOnTimeout: true });

  if (!result.ready || !result.container) {
    throw result.error || new Error('WebContainer not available');
  }

  return result.container;
}
