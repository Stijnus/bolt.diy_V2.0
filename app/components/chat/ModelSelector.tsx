import { useStore } from '@nanostores/react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Zap, Eye, Wrench, Brain, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { PROVIDERS, getModel } from '~/lib/models.client';
import { chatId } from '~/lib/persistence';
import { chatModels, currentModel, setChatModel, setCurrentModel } from '~/lib/stores/model';
import type { AIProvider, ModelInfo } from '~/types/model';

export function ModelSelector() {
  const model = useStore(currentModel);
  const activeChatId = useStore(chatId);
  const chatModelMap = useStore(chatModels);
  const chatSelection = activeChatId ? chatModelMap[activeChatId] : undefined;
  const selectedModelInfo = getModel(model.provider, model.modelId);

  useEffect(() => {
    if (!chatSelection) {
      return;
    }

    if (chatSelection.fullId !== model.fullId) {
      setCurrentModel(chatSelection.provider, chatSelection.modelId);
    }
  }, [chatSelection?.fullId, chatSelection?.modelId, chatSelection?.provider, model.fullId]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    const chatModel = chatSelection;

    if (!chatModel) {
      setChatModel(activeChatId, model.provider, model.modelId);
    }
  }, [activeChatId, chatSelection, model.provider, model.modelId]);

  const handleValueChange = (value: string) => {
    const [provider, modelId] = value.split(':') as [AIProvider, string];
    setCurrentModel(provider, modelId);

    if (activeChatId) {
      setChatModel(activeChatId, provider, modelId);
    }
  };

  return (
    <Select.Root value={model.fullId} onValueChange={handleValueChange}>
      <Select.Trigger className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg transition-colors min-w-[200px]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-bolt-elements-textSecondary" />
          <span className="font-medium text-bolt-elements-textPrimary">
            {selectedModelInfo ? selectedModelInfo.name : model.fullId}
          </span>
        </div>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-bolt-elements-textSecondary" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg z-[9999] min-w-[400px]"
          position="popper"
          sideOffset={5}
          align="start"
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
            ▲
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1 max-h-[400px]">
            {PROVIDERS.map((provider) => (
              <Select.Group key={provider.id}>
                <Select.Label className="px-6 py-2 text-xs font-semibold text-bolt-elements-textSecondary uppercase">
                  {provider.name}
                </Select.Label>
                {provider.models.map((modelInfo) => (
                  <ModelOption key={`${provider.id}:${modelInfo.id}`} model={modelInfo} />
                ))}
              </Select.Group>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
            ▼
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function ModelOption({ model }: { model: ModelInfo }) {
  const fullId = `${model.provider}:${model.id}`;
  const pricing = model.pricing;

  return (
    <Select.Item
      value={fullId}
      className="relative flex items-center px-6 py-2 text-sm rounded cursor-pointer select-none hover:bg-bolt-elements-background-depth-3 focus:bg-bolt-elements-background-depth-3 outline-none data-[state=checked]:bg-bolt-elements-background-depth-3"
    >
      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
        <Check className="w-4 h-4 text-bolt-elements-textPrimary" />
      </Select.ItemIndicator>

      <Select.ItemText asChild>
        <div className="flex-1 ml-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-bolt-elements-textPrimary">{model.name}</span>
            {model.isDefault && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text">
                Default
              </span>
            )}
          </div>
          <div className="text-xs text-bolt-elements-textSecondary mt-0.5">{model.description}</div>
          <div className="flex items-center gap-2 mt-1">
            <ModelCapabilityBadges model={model} />
            <span className="text-xs text-bolt-elements-textTertiary">
              {pricing
                ? `$${pricing.input.toFixed(2)}/${pricing.output.toFixed(2)} per 1M tokens`
                : 'Pricing unavailable'}
            </span>
          </div>
        </div>
      </Select.ItemText>
    </Select.Item>
  );
}

function ModelCapabilityBadges({ model }: { model: ModelInfo }) {
  const badges = [];

  if (model.capabilities.fast) {
    badges.push(
      <span
        key="fast"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-400"
        title="Fast"
      >
        <Zap className="w-3 h-3" />
      </span>,
    );
  }

  if (model.capabilities.reasoning) {
    badges.push(
      <span
        key="reasoning"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-purple-500/10 text-purple-400"
        title="Advanced Reasoning"
      >
        <Brain className="w-3 h-3" />
      </span>,
    );
  }

  if (model.capabilities.vision) {
    badges.push(
      <span
        key="vision"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-500/10 text-blue-400"
        title="Vision"
      >
        <Eye className="w-3 h-3" />
      </span>,
    );
  }

  if (model.capabilities.tools) {
    badges.push(
      <span
        key="tools"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-orange-500/10 text-orange-400"
        title="Tool Use"
      >
        <Wrench className="w-3 h-3" />
      </span>,
    );
  }

  return <div className="flex items-center gap-1">{badges}</div>;
}
