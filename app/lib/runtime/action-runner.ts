import * as nodePath from 'node:path';
import { WebContainer } from '@webcontainer/api';
import { map, type MapStore } from 'nanostores';
import type { ActionCallbackData } from './message-parser';
import type { BoltAction } from '~/types/actions';
import { WORK_DIR } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #completionCallbacks: Map<string, () => void> = new Map();

  actions: ActionsMap = map({});

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      this.#updateAction(actionId, { status: 'running' });
    });
  }

  /**
   * Register a completion callback for a specific action
   */
  onActionComplete(actionId: string, callback: () => void) {
    this.#completionCallbacks.set(actionId, callback);
  }

  async runAction(data: ActionCallbackData) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return;
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: true });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId);
      })
      .catch((error) => {
        console.error('Action failed:', error);
      });
  }

  async #executeAction(actionId: string) {
    const action = this.actions.get()[actionId];

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#runFileAction(action);
          break;
        }
      }

      this.#updateAction(actionId, { status: action.abortSignal.aborted ? 'aborted' : 'complete' });
    } catch (error) {
      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    const webcontainer = await this.#webcontainer;

    const process = await webcontainer.spawn('jsh', ['-c', action.content], {
      env: { npm_config_yes: true },
    });

    action.abortSignal.addEventListener('abort', () => {
      process.kill();
    });

    // Check if this is a dev server command that should complete on startup
    const isDevServerCommand = this.#isDevServerCommand(action.content);

    let completedEarly = false;

    if (isDevServerCommand) {
      // Monitor output for successful startup patterns
      const outputBuffer: string[] = [];
      const hasDevServerStarted = this.#hasDevServerStarted.bind(this);

      // Create a promise that resolves when server starts or times out
      const startupPromise: Promise<void> = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          if (!completedEarly) {
            completedEarly = true;
            logger.debug(`Dev server startup timeout for command: ${action.content}`);
            resolve();
          }
        }, 30000); // 30 second timeout

        process.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(data);
              outputBuffer.push(data);

              // Check for dev server success patterns
              if (!completedEarly && hasDevServerStarted(outputBuffer.join(''))) {
                completedEarly = true;
                clearTimeout(timeoutId);
                logger.debug(`Dev server successfully started for command: ${action.content}`);

                // IMPORTANT: Don't kill the process - let the dev server continue running
                resolve();
              }
            },
          }),
        );
      });

      // Wait for startup completion but don't kill the process
      await startupPromise;
    } else {
      // Regular command - wait for completion
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        }),
      );

      const exitCode = await process.exit;
      logger.debug(`Process terminated with code ${exitCode}`);
    }
  }

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const webcontainer = await this.#webcontainer;

    // normalize file path to be relative to WORK_DIR
    let filePath = action.filePath;

    // remove leading slash if present
    if (filePath.startsWith('/')) {
      filePath = filePath.slice(1);
    }

    // if path starts with the work directory name (e.g., "home/project/..."), strip it
    const workDirWithoutSlash = WORK_DIR.slice(1); // "home/project"

    if (filePath.startsWith(workDirWithoutSlash + '/')) {
      filePath = filePath.slice(workDirWithoutSlash.length + 1);
    }

    // ensure path is absolute by prepending WORK_DIR
    if (!filePath.startsWith(WORK_DIR.slice(1))) {
      filePath = nodePath.join(WORK_DIR, filePath);
    } else {
      filePath = '/' + filePath;
    }

    /**
     * WebContainer has workdir set to WORK_DIR (/home/project).
     * Paths must be relative to this workdir, not to container root.
     */
    const workdirRelativePath = filePath.replace(WORK_DIR + '/', '').replace(/^\//, '');
    const folder = nodePath.dirname(workdirRelativePath);

    // create folder if needed
    if (folder && folder !== '.') {
      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
        logger.debug(`Created folder: ${folder}`);
      } catch (error) {
        logger.error(`Failed to create folder ${folder}\n\n`, error);
      }
    }

    try {
      // Check if file already exists and has the same content (optimization for restored projects)
      try {
        const existingContent = await webcontainer.fs.readFile(workdirRelativePath, 'utf8');

        if (existingContent === action.content) {
          logger.debug(`File unchanged, skipping write: ${workdirRelativePath}`);
        } else {
          await webcontainer.fs.writeFile(workdirRelativePath, action.content);
          logger.debug(`File updated: ${workdirRelativePath} (content was different)`);
        }
      } catch {
        // File doesn't exist or can't be read, create it
        await webcontainer.fs.writeFile(workdirRelativePath, action.content);
        logger.debug(`File written: ${workdirRelativePath} (new file)`);
      }
    } catch (error) {
      logger.error(`Failed to write file ${workdirRelativePath}\n\n`, error);
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();
    const updatedAction = { ...actions[id], ...newState };

    this.actions.setKey(id, updatedAction);

    // Check if action completed and call completion callback
    const completionCallback = this.#completionCallbacks.get(id);

    if (completionCallback && (updatedAction.status === 'complete' || updatedAction.status === 'failed')) {
      completionCallback();
      this.#completionCallbacks.delete(id);
    }
  }

  /**
   * Check if a command is a dev server command that should complete on startup
   */
  #isDevServerCommand(command: string): boolean {
    const normalizedCommand = command.trim().toLowerCase();

    // Common dev server patterns
    const devServerPatterns = [
      'npm run dev',
      'npm start',
      'npm run start',
      'yarn dev',
      'yarn start',
      'pnpm dev',
      'pnpm start',
      'vite',
      'next dev',
      'react-scripts start',
      'angular serve',
      'vue-cli-service serve',
      'nuxt dev',
      'svelte-kit dev',
      'serve',
      'python -m http.server',
      'python3 -m http.server',
      'php -S localhost',
      'live-server',
      'webpack serve',
      'webpack-dev-server',
    ];

    return devServerPatterns.some((pattern) => normalizedCommand.includes(pattern));
  }

  /**
   * Check if dev server has successfully started based on output patterns
   */
  #hasDevServerStarted(output: string): boolean {
    const successPatterns = [
      // Vite
      /Local:\s+http:\/\/localhost:\d+/i,
      /ready in \d+ms/i,

      // Next.js
      /- Local:\s+http:\/\/localhost:\d+/i,
      /✓ Ready in/i,

      // React scripts
      /Starting the development server/i,
      /Compiled successfully!/i,
      /You can now view .* in the browser/i,

      // Angular
      /Live Development Server is listening on/i,

      // Vue CLI
      /App running at:/i,

      // Nuxt
      /Nuxt development server is running on/i,

      // SvelteKit
      /Local:\s+http:\/\/localhost:\d+/i,

      // General patterns
      /Server started on/i,
      /Listening on/i,
      /Development server running/i,
      /Dev server open/i,
      /Ready! Your application is ready/i,
      /compiled successfully/i,
      /serving at/i,
    ];

    // Check if any success pattern matches
    return successPatterns.some((pattern) => pattern.test(output));
  }
}
