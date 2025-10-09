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
 */
export async function waitForFileOperations(
  filesStore: { files: { get: () => any } },
  options: {
    timeout?: number;
    stabilityDelay?: number;
  } = {},
): Promise<void> {
  const { timeout = 2000, stabilityDelay = 100 } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let lastChangeTime = Date.now();
    let previousFileCount = Object.keys(filesStore.files.get()).length;

    const checkStability = () => {
      const now = Date.now();
      const currentFileCount = Object.keys(filesStore.files.get()).length;

      // Check if file count changed
      if (currentFileCount !== previousFileCount) {
        lastChangeTime = now;
        previousFileCount = currentFileCount;
      }

      // Check timeout
      if (now - startTime > timeout) {
        logger.warn('File operations wait timed out, proceeding anyway');
        resolve();
        return;
      }

      // Check if stable (no changes for stabilityDelay)
      if (now - lastChangeTime >= stabilityDelay) {
        logger.debug(`File operations stable after ${now - startTime}ms`);
        resolve();
        return;
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

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

/**
 * Create a promise that resolves when a store value changes
 */
export function waitForStoreChange<T>(
  store: { get: () => T; subscribe: (listener: (value: T) => void) => () => void },
  predicate: (value: T) => boolean,
  options: {
    timeout?: number;
    timeoutMessage?: string;
  } = {},
): Promise<T> {
  const { timeout = 5000, timeoutMessage = 'Store change timeout' } = options;

  return new Promise((resolve, reject) => {
    // Check current value immediately
    const currentValue = store.get();
    if (predicate(currentValue)) {
      resolve(currentValue);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Set timeout
    timeoutId = setTimeout(() => {
      unsubscribe?.();
      reject(new Error(timeoutMessage));
    }, timeout);

    // Subscribe to changes
    unsubscribe = store.subscribe((value) => {
      if (predicate(value)) {
        clearTimeout(timeoutId);
        unsubscribe?.();
        resolve(value);
      }
    });
  });
}

/**
 * Wait for a DOM element to be available
 * Useful for waiting for UI components to render
 */
export async function waitForElement(
  selector: string,
  options: {
    timeout?: number;
    container?: Element | Document;
  } = {},
): Promise<Element> {
  const { timeout = 5000, container = document } = options;

  const startTime = Date.now();

  while (true) {
    const element = container.querySelector(selector);

    if (element) {
      return element;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Element "${selector}" not found within ${timeout}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Retry an operation with exponential backoff
 * This is a simpler version for cases where the full retry utility is overkill
 */
export async function simpleRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {},
): Promise<T> {
  const { maxAttempts = 3, initialDelay = 100, maxDelay = 2000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      onRetry?.(attempt, error);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Race between a promise and a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  timeoutMessage: string = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeout),
    ),
  ]);
}

/**
 * Execute promises in sequence (one after another)
 */
export async function sequential<T>(
  operations: Array<() => Promise<T>>,
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    results.push(await operation());
  }

  return results;
}

/**
 * Execute promises with limited concurrency
 */
export async function parallelLimit<T>(
  operations: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(operations.length);
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < operations.length) {
      const currentIndex = index++;
      results[currentIndex] = await operations[currentIndex]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, operations.length) }, () => runNext());
  await Promise.all(workers);

  return results;
}
