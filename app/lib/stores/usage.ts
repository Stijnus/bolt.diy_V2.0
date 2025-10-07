import { atom, map } from 'nanostores';

export interface TokenUsage {
  input: number;
  output: number;
}

export interface SessionUsage {
  tokens: TokenUsage;
  cost: number;
  provider?: string;
  modelId?: string;
}

export const $sessionUsage = map<SessionUsage>({
  tokens: {
    input: 0,
    output: 0,
  },
  cost: 0,
});

export const $totalUsage = atom<SessionUsage[]>([]);

export function addUsage(usage: {
  inputTokens?: number | null;
  outputTokens?: number | null;
  cost?: number | null;
  provider?: string;
  modelId?: string;
}) {
  const current = $sessionUsage.get();
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;

  $sessionUsage.setKey('tokens', {
    input: current.tokens.input + inputTokens,
    output: current.tokens.output + outputTokens,
  });

  if (typeof usage.cost === 'number') {
    $sessionUsage.setKey('cost', current.cost + usage.cost);
  }

  if (usage.provider) {
    $sessionUsage.setKey('provider', usage.provider);
  }

  if (usage.modelId) {
    $sessionUsage.setKey('modelId', usage.modelId);
  }
}

export function resetSessionUsage() {
  $sessionUsage.set({
    tokens: { input: 0, output: 0 },
    cost: 0,
    provider: undefined,
    modelId: undefined,
  });
}