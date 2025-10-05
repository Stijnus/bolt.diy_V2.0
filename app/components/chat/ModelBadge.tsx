import { useStore } from '@nanostores/react';
import { Sparkles } from 'lucide-react';
import { PROVIDERS, getModel } from '~/lib/models.client';
import { currentModel } from '~/lib/stores/model';

export function ModelBadge() {
  const selection = useStore(currentModel);
  const modelInfo = getModel(selection.provider, selection.modelId);

  const providerName = PROVIDERS.find((provider) => provider.id === selection.provider)?.name ?? selection.provider;

  if (!modelInfo) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-1 text-xs text-bolt-elements-textSecondary">
      <Sparkles className="h-3.5 w-3.5 text-bolt-elements-textTertiary" />
      <span className="font-medium text-bolt-elements-textPrimary">{modelInfo.name}</span>
      <span className="text-bolt-elements-textTertiary">•</span>
      <span>{providerName}</span>
    </div>
  );
}
