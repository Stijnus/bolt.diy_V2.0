import { atom, map } from 'nanostores';

export type ConnectionStatus = 'supabase' | 'indexeddb' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  syncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

export const connectionStore = map<ConnectionState>({
  status: 'indexeddb',
  syncing: false,
  lastSyncTime: null,
  error: null,
});

export function setConnectionStatus(status: ConnectionStatus) {
  connectionStore.setKey('status', status);
}

export function setConnected(userId: string | null) {
  if (userId) {
    connectionStore.setKey('status', 'supabase');
  } else {
    connectionStore.setKey('status', 'indexeddb');
  }
}

export function setSyncing(syncing: boolean) {
  connectionStore.setKey('syncing', syncing);

  if (!syncing) {
    connectionStore.setKey('lastSyncTime', new Date());
  }
}

export function setConnectionError(error: string | null) {
  connectionStore.setKey('error', error);
}
