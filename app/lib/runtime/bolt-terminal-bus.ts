import { atom } from 'nanostores';

/*
 * A very small pub-sub buffer for the dedicated Bolt Terminal
 * Accumulates recent output and broadcasts chunks to subscribers
 */

const MAX_BUFFER_LENGTH = 200_000; // ~200 KB of text

export type BoltTerminalEntryLevel = 'info' | 'error';

export interface BoltTerminalEntry {
  id: number;
  chunk: string;
  timestamp: number;
  source?: string;
  level: BoltTerminalEntryLevel;
}

const bufferAtom = atom<string>('');
const entriesAtom = atom<BoltTerminalEntry[]>([]);

type Listener = (entry: BoltTerminalEntry) => void;

const listeners = new Set<Listener>();

let cachedEntries: BoltTerminalEntry[] = [];
let cachedLength = 0;
let entryCounter = 0;

interface WriteOptions {
  source?: string;
  level?: BoltTerminalEntryLevel;
  timestamp?: number;
}

export function writeToBoltTerminal(chunk: string, options?: WriteOptions) {
  if (!chunk) {
    return;
  }

  let normalizedChunk = chunk;

  if (chunk.length > MAX_BUFFER_LENGTH) {
    normalizedChunk = chunk.slice(-MAX_BUFFER_LENGTH);
  }

  const entry: BoltTerminalEntry = {
    id: entryCounter++,
    chunk: normalizedChunk,
    timestamp: options?.timestamp ?? Date.now(),
    source: options?.source,
    level: options?.level ?? 'info',
  };

  cachedEntries = [...cachedEntries, entry];
  cachedLength += normalizedChunk.length;

  while (cachedLength > MAX_BUFFER_LENGTH && cachedEntries.length > 1) {
    const removed = cachedEntries.shift()!;
    cachedLength -= removed.chunk.length;
  }

  if (cachedLength > MAX_BUFFER_LENGTH && cachedEntries.length === 1) {
    const only = cachedEntries[0];
    const sliced = only.chunk.slice(-MAX_BUFFER_LENGTH);
    cachedLength = sliced.length;
    cachedEntries = [{ ...only, chunk: sliced }];
  }

  const snapshot = cachedEntries;

  entriesAtom.set(snapshot);
  bufferAtom.set(snapshot.map((item) => item.chunk).join(''));

  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {}
  }
}

export function clearBoltTerminal() {
  cachedEntries = [];
  cachedLength = 0;
  bufferAtom.set('');
  entriesAtom.set([]);
}

export function getBoltTerminalBuffer(): string {
  return bufferAtom.get();
}

export function getBoltTerminalEntries(): BoltTerminalEntry[] {
  return entriesAtom.get();
}

export function subscribeBoltTerminal(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
