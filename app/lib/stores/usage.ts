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
  promptTokens: number;
  completionTokens: number;
  cost?: number | null;
  provider?: string;
  modelId?: string;
}) {
  const current = $sessionUsage.get();
  $sessionUsage.setKey('tokens', {
    input: current.tokens.input + usage.promptTokens,
    output: current.tokens.output + usage.completionTokens,
  });

  if (usage.cost) {
    $sessionUsage.setKey('cost', current.cost + usage.cost);
  }
  if(usage.provider) {
    $sessionUsage.setKey('provider', usage.provider);
  }
    if(usage.modelId) {
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