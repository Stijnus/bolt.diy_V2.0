/**
 * Actionable error messages utility
 * Provides user-friendly error messages with helpful suggestions
 */

import { createScopedLogger } from './logger';

const logger = createScopedLogger('ErrorMessages');

/**
 * Error context for generating actionable messages
 */
export interface ErrorContext {
  operation: string;
  error: unknown;
  metadata?: Record<string, any>;
}

/**
 * Actionable error message
 */
export interface ActionableError {
  title: string;
  message: string;
  actions?: Array<{ label: string; action?: () => void }>;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Common error patterns and their actionable responses
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | ((error: unknown) => boolean);
  handler: (context: ErrorContext) => ActionableError;
}> = [
  // WebContainer initialization errors
  {
    pattern: /webcontainer.*timeout|webcontainer.*30 seconds/i,
    handler: (ctx) => ({
      title: 'WebContainer Timeout',
      message: 'The in-browser development environment took too long to start.',
      actions: [
        { label: 'Reload Page', action: () => window.location.reload() },
        { label: 'Check Browser Console' },
      ],
      severity: 'error',
    }),
  },

  // File system errors
  {
    pattern: /ENOENT|no such file/i,
    handler: (ctx) => ({
      title: 'File Not Found',
      message: `Could not find the required file during ${ctx.operation}.`,
      actions: [{ label: 'Try Again' }],
      severity: 'warning',
    }),
  },

  {
    pattern: /EACCES|permission denied/i,
    handler: (ctx) => ({
      title: 'Permission Denied',
      message: 'Unable to access file due to permission restrictions.',
      actions: [{ label: 'Reload and Try Again', action: () => window.location.reload() }],
      severity: 'error',
    }),
  },

  {
    pattern: /EBUSY|resource busy/i,
    handler: (ctx) => ({
      title: 'Resource Busy',
      message: 'The file system is busy. This usually resolves automatically.',
      actions: [{ label: 'Retry Automatically (Already In Progress)' }],
      severity: 'info',
    }),
  },

  {
    pattern: /EMFILE|too many open files/i,
    handler: (ctx) => ({
      title: 'Too Many Files Open',
      message: 'The system has too many files open. Try closing some editors or reloading.',
      actions: [{ label: 'Reload Page', action: () => window.location.reload() }],
      severity: 'warning',
    }),
  },

  // Network/sync errors
  {
    pattern: /network|fetch.*failed|cors/i,
    handler: (ctx) => ({
      title: 'Network Error',
      message: 'Unable to connect to the server. Check your internet connection.',
      actions: [
        { label: 'Retry' },
        { label: 'Check Connection' },
      ],
      severity: 'warning',
    }),
  },

  {
    pattern: /authentication.*failed|unauthorized/i,
    handler: (ctx) => ({
      title: 'Authentication Failed',
      message: 'Your session may have expired. Please sign in again.',
      actions: [{ label: 'Sign In', action: () => (window.location.href = '/auth/signin') }],
      severity: 'warning',
    }),
  },

  // Supabase errors
  {
    pattern: /supabase.*unavailable|supabase client/i,
    handler: (ctx) => ({
      title: 'Cloud Sync Unavailable',
      message: 'Cloud sync is disabled. Your work is saved locally but will not sync across devices.',
      actions: [{ label: 'Continue Offline' }],
      severity: 'info',
    }),
  },

  // Validation errors
  {
    pattern: /invalid.*json|unexpected token.*json/i,
    handler: (ctx) => ({
      title: 'Invalid JSON',
      message: `Configuration file contains invalid JSON syntax.`,
      actions: [{ label: 'Check File Syntax' }],
      severity: 'error',
    }),
  },

  // Size limit errors
  {
    pattern: /exceeds.*size|file.*too large/i,
    handler: (ctx) => ({
      title: 'File Too Large',
      message: 'Some files exceed size limits and were skipped from chat history.',
      actions: [{ label: 'See Details in Console' }],
      severity: 'warning',
    }),
  },

  // Timeout errors
  {
    pattern: /timeout|timed out/i,
    handler: (ctx) => ({
      title: 'Operation Timed Out',
      message: `${ctx.operation} took too long and was cancelled.`,
      actions: [
        { label: 'Try Again' },
        { label: 'Reload Page', action: () => window.location.reload() },
      ],
      severity: 'warning',
    }),
  },

  // Browser compatibility
  {
    pattern: /not supported.*browser|webcontainer.*unsupported/i,
    handler: (ctx) => ({
      title: 'Browser Not Supported',
      message: 'This browser may not fully support the development environment.',
      actions: [{ label: 'Use Chrome or Edge' }],
      severity: 'error',
    }),
  },

  // Memory errors
  {
    pattern: /out of memory|quota.*exceeded/i,
    handler: (ctx) => ({
      title: 'Memory Limit Reached',
      message: 'The browser has run out of memory. Try closing other tabs or reloading.',
      actions: [
        { label: 'Close Other Tabs' },
        { label: 'Reload Page', action: () => window.location.reload() },
      ],
      severity: 'error',
    }),
  },
];

/**
 * Generate an actionable error message from an error context
 */
export function getActionableError(context: ErrorContext): ActionableError {
  const errorMessage = context.error instanceof Error ? context.error.message : String(context.error);
  const errorString = errorMessage.toLowerCase();

  // Try to match error patterns
  for (const { pattern, handler } of ERROR_PATTERNS) {
    if (typeof pattern === 'function') {
      if (pattern(context.error)) {
        logger.debug(`Matched error pattern (function) for: ${context.operation}`);
        return handler(context);
      }
    } else if (pattern.test(errorString)) {
      logger.debug(`Matched error pattern (regex) for: ${context.operation}`);
      return handler(context);
    }
  }

  // Default fallback message
  logger.debug(`No pattern matched for error in: ${context.operation}`);
  return {
    title: 'Unexpected Error',
    message: `An error occurred during ${context.operation}: ${errorMessage}`,
    actions: [
      { label: 'Try Again' },
      { label: 'Report Issue' },
    ],
    severity: 'error',
  };
}

/**
 * Format actionable error for toast display
 */
export function formatErrorForToast(actionableError: ActionableError): string {
  let message = `${actionableError.title}: ${actionableError.message}`;

  if (actionableError.actions && actionableError.actions.length > 0) {
    const actionLabels = actionableError.actions.map((a) => a.label).join(' | ');
    message += `\n\n💡 ${actionLabels}`;
  }

  return message;
}

/**
 * Handle error with actionable message and optional toast
 */
export function handleErrorWithAction(
  context: ErrorContext,
  options: {
    showToast?: boolean;
    toast?: any; // react-toastify toast instance
    logError?: boolean;
  } = {},
): ActionableError {
  const { showToast = true, toast, logError = true } = options;

  const actionableError = getActionableError(context);

  // Log the error
  if (logError) {
    const logMethod = actionableError.severity === 'error' ? 'error' : 'warn';
    logger[logMethod](
      `${context.operation} failed: ${actionableError.title} - ${actionableError.message}`,
      context.error,
    );
  }

  // Show toast if requested
  if (showToast && toast) {
    const toastMessage = formatErrorForToast(actionableError);
    const toastMethod = actionableError.severity === 'error' ? 'error' : actionableError.severity === 'warning' ? 'warning' : 'info';

    toast[toastMethod](toastMessage, {
      autoClose: actionableError.severity === 'error' ? false : 5000,
      closeOnClick: true,
      draggable: true,
    });
  }

  return actionableError;
}

/**
 * Create a retry handler with actionable error messages
 */
export function createRetryHandler(
  operation: string,
  maxRetries: number = 3,
): {
  attempt: number;
  canRetry: boolean;
  handleError: (error: unknown, toast?: any) => ActionableError;
  reset: () => void;
} {
  let attempt = 0;

  return {
    get attempt() {
      return attempt;
    },
    get canRetry() {
      return attempt < maxRetries;
    },
    handleError(error: unknown, toast?: any) {
      attempt++;
      const isLastAttempt = attempt >= maxRetries;

      const actionableError = getActionableError({
        operation,
        error,
        metadata: { attempt, maxRetries },
      });

      // Modify message to include retry info
      if (!isLastAttempt) {
        actionableError.message += ` (Attempt ${attempt}/${maxRetries})`;
        actionableError.actions = [{ label: `Retrying automatically...` }];
      }

      if (toast) {
        const toastMessage = formatErrorForToast(actionableError);
        const toastMethod = isLastAttempt ? 'error' : 'warning';

        toast[toastMethod](toastMessage, {
          autoClose: isLastAttempt ? false : 3000,
          closeOnClick: true,
          draggable: true,
        });
      }

      return actionableError;
    },
    reset() {
      attempt = 0;
    },
  };
}

/**
 * Common error message templates
 */
export const ERROR_TEMPLATES = {
  fileRestoration: (fileCount: number) =>
    `Restoring ${fileCount} file${fileCount === 1 ? '' : 's'} to development environment`,
  chatLoad: () => 'Loading chat history',
  chatSave: () => 'Saving chat to cloud',
  webcontainerInit: () => 'Initializing development environment',
  fileWrite: (fileName: string) => `Writing file: ${fileName}`,
  fileRead: (fileName: string) => `Reading file: ${fileName}`,
  validation: () => 'Validating project structure',
} as const;
