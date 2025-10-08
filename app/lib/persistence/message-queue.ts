import type { UIMessage } from 'ai';
import { setQueueSize, setSavingInProgress } from '~/lib/stores/connection';
import type { FullModelId } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MessageQueue');

export interface QueuedMessageOperation {
  id: string;
  messages: UIMessage[];
  modelFullId?: FullModelId;
  timestamp: number;
  resolve: () => void;
  reject: (error: Error) => void;
}

class MessagePersistenceQueue {
  private queue: QueuedMessageOperation[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly PROCESSING_TIMEOUT = 30000; // 30 seconds

  /**
   * Add a message persistence operation to the queue
   */
  async enqueue(
    messages: UIMessage[],
    executor: (messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>,
    modelFullId?: FullModelId,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const operation: QueuedMessageOperation = {
        id: this.generateOperationId(messages),
        messages,
        modelFullId,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      // Remove old operations to prevent queue from growing indefinitely
      this.cleanupOldOperations();

      // Check if we already have a similar operation in the queue
      const existingIndex = this.queue.findIndex(
        (op) => op.id === operation.id && Math.abs(op.timestamp - operation.timestamp) < 1000,
      );

      if (existingIndex !== -1) {
        // Replace existing operation with newer one
        this.queue[existingIndex] = operation;
        logger.debug(`Replaced existing operation in queue: ${operation.id}`);
      } else {
        // Add new operation
        this.queue.push(operation);
        logger.debug(`Added operation to queue: ${operation.id}, queue size: ${this.queue.length}`);
      }

      // Update connection status
      setQueueSize(this.queue.length);

      // Start processing if not already running
      this.processQueue(executor);
    });
  }

  /**
   * Process the queue of operations
   */
  private async processQueue(executor: (messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>) {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    setSavingInProgress(true);
    logger.info('Starting to process message queue');

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;

      // Update queue size
      setQueueSize(this.queue.length);

      try {
        logger.debug(`Processing operation: ${operation.id}`);

        // Add timeout to prevent infinite processing
        await Promise.race([
          executor(operation.messages, operation.modelFullId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation processing timeout')), this.PROCESSING_TIMEOUT),
          ),
        ]);

        operation.resolve();
        logger.debug(`Completed operation: ${operation.id}`);
      } catch (error) {
        logger.error(`Failed to process operation: ${operation.id}`, error);
        operation.reject(error as Error);
      }
    }

    this.isProcessing = false;
    setSavingInProgress(false);
    setQueueSize(0);
    logger.info('Finished processing message queue');
  }

  /**
   * Generate a unique operation ID based on messages
   */
  private generateOperationId(messages: UIMessage[]): string {
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) {
      return 'empty';
    }

    const content = Array.isArray((lastMessage as any).parts)
      ? (lastMessage as any).parts
          .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')
          .substring(0, 50)
      : ((lastMessage as any).content ?? '').substring(0, 50);

    return `${lastMessage.role}-${content}-${Date.now()}`;
  }

  /**
   * Remove old operations from the queue
   */
  private cleanupOldOperations() {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    const originalSize = this.queue.length;
    this.queue = this.queue.filter((op) => now - op.timestamp < maxAge);

    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      // Keep only the most recent operations
      this.queue = this.queue.slice(-this.MAX_QUEUE_SIZE);
    }

    if (this.queue.length !== originalSize) {
      logger.debug(`Cleaned up ${originalSize - this.queue.length} old operations`);
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): { queueSize: number; isProcessing: number } {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing ? 1 : 0,
    };
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    const clearedCount = this.queue.length;

    // Reject all pending operations
    this.queue.forEach((operation) => {
      operation.reject(new Error('Queue cleared'));
    });

    this.queue = [];
    logger.info(`Cleared ${clearedCount} pending operations`);
  }
}

// Singleton instance
export const messageQueue = new MessagePersistenceQueue();

/**
 * Execute a message persistence operation with queuing
 */
export function executeWithQueue(
  messages: UIMessage[],
  executor: (messages: UIMessage[], modelFullId?: FullModelId) => Promise<void>,
  modelFullId?: FullModelId,
): Promise<void> {
  return messageQueue.enqueue(messages, executor, modelFullId);
}
