import { atom } from 'nanostores';

// A very small pub-sub buffer for the dedicated Bolt Terminal
// Accumulates recent output and broadcasts chunks to subscribers

const MAX_BUFFER_LENGTH = 200_000; // ~200 KB of text

const bufferAtom = atom<string>('');

type Listener = (chunk: string) => void;
const listeners = new Set<Listener>();

export function writeToBoltTerminal(chunk: string) {
  if (!chunk) return;
  try {
    const current = bufferAtom.get();
    const next = (current + chunk).slice(-MAX_BUFFER_LENGTH);
    bufferAtom.set(next);
  } finally {
    for (const l of listeners) {
      try {
        l(chunk);
      } catch {}
    }
  }
}

export function clearBoltTerminal() {
  bufferAtom.set('');
}

export function getBoltTerminalBuffer(): string {
  return bufferAtom.get();
}

export function subscribeBoltTerminal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

