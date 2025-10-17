import { useStore } from '@nanostores/react';
import { Sparkles } from 'lucide-react';
import { PROVIDERS, getModel } from '~/lib/models.client';
import { currentModel } from '~/lib/stores/model';

export function ModelBadge() {
  const { provider, modelId } = useStore(currentModel);
  const modelInfo = getModel(provider, modelId);

  if (!modelInfo) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-1 text-xs text-bolt-elements-textSecondary">
      <Sparkles className="h-4 w-4 text-bolt-elements-textTertiary" />
      <span className="font-medium text-bolt-elements-textPrimary">{modelInfo.name}</span>
      <span className="text-bolt-elements-textTertiary">•</span>
      <span>{PROVIDERS.find((p) => p.id === provider)?.name ?? provider}</span>
    </div>
  );
}
