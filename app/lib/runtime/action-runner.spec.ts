import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionRunner } from './action-runner';
import type { ActionCallbackData } from './message-parser';

describe('ActionRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ActionRunner.resetGlobalStateForTesting();
  });

  // Mock WebContainer
  const mockWebContainer = {
    spawn: vi.fn(),
    fs: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      readFile: vi.fn(),
    },
  };

  const mockWebContainerPromise = Promise.resolve(mockWebContainer as any);

  describe('addAction deduplication', () => {
    it('should deduplicate shell actions with identical content', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      const action1: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action1',
        action: {
          type: 'shell',
          content: 'npm install',
        },
      };

      const action2: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action2',
        action: {
          type: 'shell',
          content: 'npm install', // Same content
        },
      };

      runner.addAction(action1);
      runner.addAction(action2);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(1);
      expect(actions.action1).toBeDefined();
      expect(actions.action2).toBeUndefined();
    });

    it('should deduplicate shell actions with trimmed identical content', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      const action1: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action1',
        action: {
          type: 'shell',
          content: 'npm install',
        },
      };

      const action2: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action2',
        action: {
          type: 'shell',
          content: '  npm install  ', // Same content with whitespace
        },
      };

      runner.addAction(action1);
      runner.addAction(action2);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(1);
      expect(actions.action1).toBeDefined();
      expect(actions.action2).toBeUndefined();
    });

    it('should not deduplicate shell actions with different content', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      const action1: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action1',
        action: {
          type: 'shell',
          content: 'npm install',
        },
      };

      const action2: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action2',
        action: {
          type: 'shell',
          content: 'npm run dev', // Different content
        },
      };

      runner.addAction(action1);
      runner.addAction(action2);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(2);
      expect(actions.action1).toBeDefined();
      expect(actions.action2).toBeDefined();
    });

    it('should keep separate file actions even when filePath matches (execute sequentially)', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      const action1: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action1',
        action: {
          type: 'file',
          filePath: 'package.json',
          content: '{"name": "old"}',
        },
      };

      const action2: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action2',
        action: {
          type: 'file',
          filePath: 'package.json', // Same filePath
          content: '{"name": "new"}', // New content
        },
      };

      runner.addAction(action1);
      runner.addAction(action2);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(2);
      expect(actions.action1).toBeDefined();
      expect(actions.action1?.content).toBe('{"name": "old"}');
      expect(actions.action2).toBeDefined();
      expect(actions.action2?.content).toBe('{"name": "new"}');
    });

    it('should not deduplicate file actions with different filePaths', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      const action1: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action1',
        action: {
          type: 'file',
          filePath: 'package.json',
          content: '{"name": "test"}',
        },
      };

      const action2: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'action2',
        action: {
          type: 'file',
          filePath: 'index.js', // Different filePath
          content: 'console.log("hello");',
        },
      };

      runner.addAction(action1);
      runner.addAction(action2);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(2);
      expect(actions.action1).toBeDefined();
      expect(actions.action2).toBeDefined();
    });

    it('should handle mixed action types correctly', () => {
      const runner = new ActionRunner(mockWebContainerPromise);

      // Add shell action
      const shellAction: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'shell1',
        action: {
          type: 'shell',
          content: 'npm install',
        },
      };

      // Add file action
      const fileAction: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'file1',
        action: {
          type: 'file',
          filePath: 'package.json',
          content: '{"name": "test"}',
        },
      };

      // Add duplicate shell action (should be skipped)
      const duplicateShellAction: ActionCallbackData = {
        artifactId: 'artifact1',
        messageId: 'message1',
        actionId: 'shell2',
        action: {
          type: 'shell',
          content: 'npm install',
        },
      };

      runner.addAction(shellAction);
      runner.addAction(fileAction);
      runner.addAction(duplicateShellAction);

      const actions = runner.actions.get();
      expect(Object.keys(actions)).toHaveLength(2);
      expect(actions.shell1).toBeDefined();
      expect(actions.file1).toBeDefined();
      expect(actions.shell2).toBeUndefined();
    });

    it('should deduplicate shell actions across different runners (global registry)', () => {
      const runnerA = new ActionRunner(mockWebContainerPromise);
      const runnerB = new ActionRunner(mockWebContainerPromise);

      const shellActionA: ActionCallbackData = {
        artifactId: 'artifactA',
        messageId: 'messageA',
        actionId: 'shellA',
        action: {
          type: 'shell',
          content: 'npm run dev',
        },
      };

      const shellActionB: ActionCallbackData = {
        artifactId: 'artifactB',
        messageId: 'messageB',
        actionId: 'shellB',
        action: {
          type: 'shell',
          content: 'npm   run    dev', // Same command with different whitespace
        },
      };

      runnerA.addAction(shellActionA);
      runnerB.addAction(shellActionB);

      const actionsA = runnerA.actions.get();
      const actionsB = runnerB.actions.get();

      expect(Object.keys(actionsA)).toHaveLength(1);
      expect(actionsA.shellA).toBeDefined();

      // Second runner should skip registering the duplicate command globally
      expect(Object.keys(actionsB)).toHaveLength(0);
      expect(actionsB.shellB).toBeUndefined();
    });
  });
});
