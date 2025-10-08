import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('TimeoutWrapper');

export interface TimeoutOptions {
  timeout?: number; // in milliseconds
  fallbackValue?: any;
  errorMessage?: string;
}

/**
 * Wrap a promise with timeout functionality
 */
export function withTimeout<T>(promise: Promise<T>, options: TimeoutOptions = {}): Promise<T> {
  const {
    timeout = 10000, // 10 seconds default
    fallbackValue,
    errorMessage = 'Operation timed out',
  } = options;

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      logger.warn(`${errorMessage} after ${timeout}ms`);

      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(errorMessage));
      }
    }, timeout);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Wrap an async function with timeout functionality
 */
export function withTimeoutAsync<T extends any[], R>(fn: (...args: T) => Promise<R>, options: TimeoutOptions = {}) {
  return (...args: T): Promise<R> => {
    return withTimeout(fn(...args), options);
  };
}

/**
 * Create a timeout wrapper for database operations with retry logic
 */
export function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    operationName?: string;
  } = {},
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, timeout = 10000, operationName = 'database operation' } = options;

  let lastError: Error | null = null;

  const attempt = async (attemptNumber: number): Promise<T> => {
    try {
      logger.debug(`Attempting ${operationName} (attempt ${attemptNumber}/${maxRetries})`);

      const result = await withTimeout(operation(), {
        timeout,
        errorMessage: `${operationName} timed out`,
      });

      if (attemptNumber > 1) {
        logger.info(`${operationName} succeeded on attempt ${attemptNumber}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      logger.error(`${operationName} failed on attempt ${attemptNumber}:`, error);

      if (attemptNumber < maxRetries) {
        const delay = retryDelay * Math.pow(2, attemptNumber - 1); // Exponential backoff
        logger.info(`Retrying ${operationName} in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));

        return attempt(attemptNumber + 1);
      } else {
        logger.error(`${operationName} failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
    }
  };

  return attempt(1);
}
