import { atom, map, type MapStore, type WritableAtom } from 'nanostores';
import type { DevServerError } from '~/types/errors';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ErrorStore');

export class ErrorStore {
  /**
   * Map of active errors by ID
   */
  errors: MapStore<Record<string, DevServerError>> = map({});

  /**
   * Whether error monitoring is enabled
   */
  monitoringEnabled: WritableAtom<boolean> = atom(true);

  /**
   * Total error count (including dismissed)
   */
  totalErrorCount: WritableAtom<number> = atom(0);

  /**
   * Add a new error
   */
  addError(error: Omit<DevServerError, 'id' | 'timestamp' | 'dismissed'>) {
    const id = this.#generateErrorId(error);

    // Check if error already exists
    const existingError = this.errors.get()[id];

    if (existingError) {
      logger.debug('Error already exists, skipping duplicate:', error.message);
      return;
    }

    const newError: DevServerError = {
      ...error,
      id,
      timestamp: Date.now(),
      dismissed: false,
    };

    this.errors.setKey(id, newError);
    this.totalErrorCount.set(this.totalErrorCount.get() + 1);

    logger.info(`New ${error.severity} detected: ${error.message}`, {
      file: error.file,
      line: error.line,
      source: error.source,
    });
  }

  /**
   * Dismiss an error
   */
  dismissError(errorId: string) {
    const error = this.errors.get()[errorId];

    if (!error) {
      return;
    }

    this.errors.setKey(errorId, { ...error, dismissed: true });
    logger.debug('Error dismissed:', errorId);
  }

  /**
   * Dismiss all errors
   */
  dismissAllErrors() {
    const errors = this.errors.get();

    const dismissedErrors = Object.fromEntries(
      Object.entries(errors).map(([id, error]) => [id, { ...error, dismissed: true }]),
    );

    this.errors.set(dismissedErrors);
    logger.debug('All errors dismissed');
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors.set({});
    logger.debug('All errors cleared');
  }

  /**
   * Get active (non-dismissed) errors
   */
  getActiveErrors(): DevServerError[] {
    return Object.values(this.errors.get()).filter((error) => !error.dismissed);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'error' | 'warning'): DevServerError[] {
    return this.getActiveErrors().filter((error) => error.severity === severity);
  }

  /**
   * Get errors by file
   */
  getErrorsByFile(file: string): DevServerError[] {
    return this.getActiveErrors().filter((error) => error.file === file);
  }

  /**
   * Toggle error monitoring
   */
  toggleMonitoring(enabled?: boolean) {
    const newValue = enabled ?? !this.monitoringEnabled.get();
    this.monitoringEnabled.set(newValue);
    logger.info(`Error monitoring ${newValue ? 'enabled' : 'disabled'}`);
  }

  /**
   * Generate a unique error ID based on error properties
   */
  #generateErrorId(error: Partial<DevServerError>): string {
    const parts = [error.message, error.file, error.line?.toString(), error.column?.toString()].filter(Boolean);

    return parts.join(':');
  }
}

export const errorStore = new ErrorStore();
