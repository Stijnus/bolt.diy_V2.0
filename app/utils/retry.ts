/**
 * Retry utility with exponential backoff for handling transient failures
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (not including the initial attempt)
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before the first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Optional function to determine if an error should trigger a retry
   * If not provided, all errors will trigger retries
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /**
   * Optional callback called before each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, nextDelay: number) => void;
}

export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** The result if successful */
  data?: T;

  /** The final error if all retries failed */
  error?: unknown;

  /** Number of attempts made (including the initial attempt) */
  attempts: number;

  /** Total time spent (including delays) in milliseconds */
  totalTime: number;
}

/**
 * Default retry condition - retries on any error
 */
const defaultShouldRetry = () => true;

/**
 * Calculate delay for the next retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>>): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(exponentialDelay, options.maxDelay);
}

/**
 * Execute an async operation with retry logic and exponential backoff
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Failed to fetch');
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms: ${error}`);
 *     }
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  const startTime = Date.now();
  let lastError: unknown;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxAttempts + 1; attempt++) {
    attempts = attempt;

    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // If this was the last attempt, or the error is not retryable, fail immediately
      if (attempt > maxAttempts || !shouldRetry(error, attempt)) {
        break;
      }

      // Calculate delay for the next retry
      const delay = calculateDelay(attempt, { initialDelay, maxDelay, backoffMultiplier, maxAttempts });

      // Call onRetry callback if provided
      onRetry?.(error, attempt, delay);

      // Wait before the next retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError,
    attempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Retry all operations in parallel with individual retry logic
 *
 * @example
 * ```ts
 * const results = await retryAllWithBackoff([
 *   () => writeFile('file1.txt', 'content1'),
 *   () => writeFile('file2.txt', 'content2'),
 *   () => writeFile('file3.txt', 'content3'),
 * ], {
 *   maxAttempts: 2,
 *   initialDelay: 500,
 * });
 *
 * const successful = results.filter(r => r.success);
 * const failed = results.filter(r => !r.success);
 * ```
 */
export async function retryAllWithBackoff<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<Array<RetryResult<T>>> {
  return Promise.all(operations.map((operation) => retryWithBackoff(operation, options)));
}

/**
 * Batch retry - retry operations in batches to limit concurrency
 *
 * @example
 * ```ts
 * const results = await batchRetryWithBackoff(
 *   [op1, op2, op3, op4, op5],
 *   { maxAttempts: 2, batchSize: 2 }
 * );
 * ```
 */
export async function batchRetryWithBackoff<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions & { batchSize?: number } = {},
): Promise<Array<RetryResult<T>>> {
  const { batchSize = 5, ...retryOptions } = options;
  const results: Array<RetryResult<T>> = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await retryAllWithBackoff(batch, retryOptions);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Helper to format retry result for logging
 */
export function formatRetryResult<T>(result: RetryResult<T>, operationName: string): string {
  if (result.success) {
    return `✅ ${operationName} succeeded after ${result.attempts} attempt(s) in ${result.totalTime}ms`;
  } else {
    return `❌ ${operationName} failed after ${result.attempts} attempt(s) in ${result.totalTime}ms: ${result.error}`;
  }
}

/**
 * Helper to create a retry condition based on specific error types
 */
export function retryOnErrorType(errorTypes: Array<new (...args: any[]) => Error>): RetryOptions['shouldRetry'] {
  return (error: unknown) => {
    return errorTypes.some((ErrorType) => error instanceof ErrorType);
  };
}

/**
 * Helper to create a retry condition based on error messages
 */
export function retryOnErrorMessage(patterns: Array<string | RegExp>): RetryOptions['shouldRetry'] {
  return (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    return patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  };
}
