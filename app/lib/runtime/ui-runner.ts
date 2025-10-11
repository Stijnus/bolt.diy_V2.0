import { ActionRunner } from '~/lib/runtime/action-runner';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';

let runner: ActionRunner | null = null;

function getRunner() {
  if (!runner) {
    runner = new ActionRunner(webcontainer);
  }

  return runner;
}

export function killDevServer() {
  ActionRunner.killDevServer();
  workbenchStore.setDevServerRunning(false);
}

export async function startDevServer(command?: string) {
  // Ensure terminal is visible and workbench open
  workbenchStore.setShowWorkbench(true);
  workbenchStore.toggleTerminal(true);

  const cmd = command || workbenchStore.getRestartCommand() || 'npm run dev';

  const r = getRunner();
  const baseId = `ui_${Date.now()}`;
  const devId = `${baseId}_dev`;

  const action: ActionCallbackData = {
    messageId: baseId,
    artifactId: baseId,
    actionId: devId,
    action: { type: 'shell', content: cmd },
  };

  r.addAction(action);
  r.runAction(action);
  workbenchStore.setDevServerRunning(true);
}

export async function restartDevServer(command?: string) {
  killDevServer();

  // tiny delay to allow process cleanup
  await new Promise((r) => setTimeout(r, 150));
  await startDevServer(command);
}
