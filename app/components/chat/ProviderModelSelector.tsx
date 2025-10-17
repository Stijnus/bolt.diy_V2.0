import { useStore } from '@nanostores/react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Zap, Eye, Wrench, Brain } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PROVIDERS, MODELS, getModel } from '~/lib/models.client';
import { chatId } from '~/lib/persistence';
import { getProviderConfig } from '~/lib/provider-config';
import { chatModels, currentModel, setChatModel, setCurrentModel } from '~/lib/stores/model';
import type { AIProvider, ModelInfo } from '~/types/model';

// Reusable selector button styles
const SELECTOR_BUTTON_CLASS = `
  group inline-flex items-center gap-2 px-4 py-3 text-sm
  bg-gradient-to-br from-bolt-elements-bg-depth-2 to-bolt-elements-bg-depth-3
  border-2 border-bolt-elements-borderColor rounded-xl shadow-sm
  hover:shadow-md hover:border-bolt-elements-borderColorActive hover:text-bolt-elements-button-primary-text
  transition-all duration-200
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-borderColorActive
  flex-1
`;

const DROPDOWN_CONTENT_CLASS = `
  overflow-hidden bg-bolt-elements-background-depth-2 border-2 border-bolt-elements-borderColor
  rounded-xl shadow-2xl z-[9999] animate-scaleIn backdrop-blur-xl
`;

const SCROLL_BUTTON_CLASS = `
  flex items-center justify-center h-6 bg-bolt-elements-background-depth-2
  text-bolt-elements-textSecondary cursor-default
`;

export function ProviderModelSelector() {
  const model = useStore(currentModel);
  const activeChatId = useStore(chatId);
  const chatModelMap = useStore(chatModels);
  const chatSelection = activeChatId ? chatModelMap[activeChatId] : undefined;

  const [availableProviders, setAvailableProviders] = useState<Set<string> | null>(null);

  // Runtime models: fallback to static models
  const [runtimeModels] = useState<Record<AIProvider, ModelInfo[]>>({ ...(MODELS as any) });

  // Fetch which providers are configured
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/providers');

        if (!res.ok) {
          throw new Error('Failed to fetch');
        }

        const data: any = await res.json();
        const set = new Set<string>();

        if (data?.providers) {
          for (const [k, v] of Object.entries<boolean>(data.providers)) {
            if (v) {
              set.add(k);
            }
          }
        }

        if (active) {
          setAvailableProviders(set.size > 0 ? set : null);
        }
      } catch {
        if (active) {
          setAvailableProviders(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Simple filtered providers - show all if null, filter if loaded
  const filteredProviders = useMemo(() => {
    if (availableProviders === null) {
      return PROVIDERS;
    }

    return PROVIDERS.filter((p) => availableProviders.has(p.id));
  }, [availableProviders]);

  // Handle chat selection changes
  useEffect(() => {
    if (chatSelection && chatSelection.fullId !== model.fullId) {
      setCurrentModel(chatSelection.provider, chatSelection.modelId);
    }
  }, [chatSelection, model.fullId]);

  const selectedModelInfo = getModel(model.provider, model.modelId);

  const handleProviderChange = (newProvider: AIProvider) => {
    // Select the default model for this provider
    const list = runtimeModels[newProvider] || MODELS[newProvider];
    const defaultModel = list.find((m) => m.isDefault) || list[0];

    if (defaultModel) {
      setCurrentModel(newProvider, defaultModel.id);

      if (activeChatId) {
        setChatModel(activeChatId, newProvider, defaultModel.id);
      }
    }
  };

  const handleModelChange = (value: string) => {
    const [provider, modelId] = value.split(':') as [AIProvider, string];
    setCurrentModel(provider, modelId);

    if (activeChatId) {
      setChatModel(activeChatId, provider, modelId);
    }
  };

  const providerConfig = getProviderConfig(model.provider);
  const ProviderIcon = providerConfig.icon;
  const modelCount = runtimeModels[model.provider]?.length ?? MODELS[model.provider]?.length ?? 0;

  return (
    <div className="flex gap-3 items-center w-full">
      {/* Provider Selector */}
      <Select.Root value={model.provider} onValueChange={handleProviderChange}>
        <Select.Trigger className={SELECTOR_BUTTON_CLASS}>
          <div className="w-6 h-6 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center flex-shrink-0">
            <ProviderIcon className="w-4 h-4 text-bolt-elements-textSecondary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-semibold text-bolt-elements-textPrimary truncate">{providerConfig.name}</div>
            <div className="text-xs text-bolt-elements-textTertiary">{modelCount} models</div>
          </div>
          <Select.Icon className="flex-shrink-0">
            <ChevronDown className="w-4 h-4 text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary transition-colors" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className={`${DROPDOWN_CONTENT_CLASS} min-w-[240px]`} position="popper" sideOffset={8}>
            <Select.ScrollUpButton className={SCROLL_BUTTON_CLASS}>▲</Select.ScrollUpButton>
            <Select.Viewport className="p-2 max-h-[400px]">
              {filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => {
                  const prov = provider.id as AIProvider;
                  const modelCount = runtimeModels[prov]?.length ?? MODELS[prov]?.length ?? 0;

                  return <ProviderOption key={provider.id} provider={prov} modelCount={modelCount} />;
                })
              ) : (
                <div className="px-3 py-2 text-sm text-bolt-elements-textSecondary">No providers configured</div>
              )}
            </Select.Viewport>
            <Select.ScrollDownButton className={SCROLL_BUTTON_CLASS}>▼</Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Model Selector (filtered by provider) */}
      <Select.Root value={model.fullId} onValueChange={handleModelChange}>
        <Select.Trigger className={SELECTOR_BUTTON_CLASS}>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-semibold text-bolt-elements-textPrimary truncate">
              {selectedModelInfo ? selectedModelInfo.name : model.modelId}
            </div>
            {selectedModelInfo && (
              <div className="text-xs text-bolt-elements-textTertiary truncate">
                {selectedModelInfo.description.substring(0, 40)}...
              </div>
            )}
          </div>
          <Select.Icon className="flex-shrink-0">
            <ChevronDown className="w-4 h-4 text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary transition-colors" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className={`${DROPDOWN_CONTENT_CLASS} min-w-[480px]`} position="popper" sideOffset={8}>
            <Select.ScrollUpButton className={SCROLL_BUTTON_CLASS}>▲</Select.ScrollUpButton>
            <Select.Viewport className="p-2 max-h-[400px]">
              {(runtimeModels[model.provider] || MODELS[model.provider])?.map((modelInfo) => (
                <ModelOption key={`${model.provider}:${modelInfo.id}`} model={modelInfo} />
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className={SCROLL_BUTTON_CLASS}>▼</Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function ProviderOption({ provider, modelCount }: { provider: AIProvider; modelCount: number }) {
  const config = getProviderConfig(provider);
  const ProviderIcon = config.icon;

  // modelCount provided via props to keep this component pure

  return (
    <Select.Item
      value={provider}
      className="relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer select-none hover:bg-bolt-elements-background-depth-3 focus:bg-bolt-elements-background-depth-3 outline-none transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center group-hover:scale-110 transition-transform">
        <ProviderIcon className="w-5 h-5 text-bolt-elements-textSecondary group-data-[highlighted]:text-bolt-elements-button-primary-text" />
      </div>

      <Select.ItemText asChild>
        <div className="flex-1">
          <div className="font-semibold text-bolt-elements-textPrimary group-data-[highlighted]:text-bolt-elements-button-primary-text">
            {config.name}
          </div>
          <div className="text-xs text-bolt-elements-textTertiary group-data-[highlighted]:text-bolt-elements-button-primary-text">
            {modelCount} models available
          </div>
        </div>
      </Select.ItemText>

      <Select.ItemIndicator className="inline-flex items-center">
        <div className="w-6 h-6 rounded-full bg-bolt-elements-button-primary-background flex items-center justify-center">
          <Check className="w-4 h-4 text-bolt-elements-button-primary-text" />
        </div>
      </Select.ItemIndicator>
    </Select.Item>
  );
}

function ModelOption({ model }: { model: ModelInfo }) {
  const fullId = `${model.provider}:${model.id}`;
  const pricing = model.pricing;

  return (
    <Select.Item
      value={fullId}
      className="relative flex flex-col px-3 py-2.5 mb-1.5 rounded-lg cursor-pointer select-none
        min-h-[110px] max-h-[110px]
        border border-bolt-elements-borderColor
        bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2
        hover:border-bolt-elements-borderColorActive hover:shadow-md
        focus:border-bolt-elements-borderColorActive focus:shadow-md
        outline-none transition-all duration-200 group
        hover:scale-[1.005] focus:scale-[1.005] data-[highlighted]:text-bolt-elements-button-primary-text data-[highlighted] [&>div]:data-[highlighted]:text-bolt-elements-button-primary-text"
    >
      {/* Check Indicator - Top Right Badge */}
      <Select.ItemIndicator className="absolute top-1.5 right-1.5 flex-shrink-0 animate-scaleIn">
        <div className="w-5 h-5 rounded-full bg-bolt-elements-button-primary-background border border-bolt-elements-borderColorActive flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-bolt-elements-button-primary-text" />
        </div>
      </Select.ItemIndicator>

      <Select.ItemText asChild>
        <div className="flex-1 min-w-0 pr-6">
          {/* Model Name & Default Badge */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-bold text-bolt-elements-textPrimary group-hover:text-bolt-elements-icon-primary transition-colors truncate">
              {model.name}
            </span>
            {model.isDefault && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-gradient-to-r from-bolt-elements-button-primary-background to-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text border border-bolt-elements-borderColorActive shadow-sm flex-shrink-0">
                Default
              </span>
            )}
          </div>

          {/* Description - 1 line only */}
          <div className="text-xs text-bolt-elements-textSecondary mb-2 line-clamp-1 leading-tight">
            {model.description}
          </div>

          {/* Divider */}
          <div className="h-px bg-bolt-elements-borderColor mb-2 opacity-40" />

          {/* Metadata Row: Badges + Pricing */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              <ModelCapabilityBadges model={model} />
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor flex-shrink-0">
              <span className="text-[10px] font-medium text-bolt-elements-textSecondary whitespace-nowrap">
                {pricing
                  ? `$${pricing.input < 1 ? pricing.input.toFixed(2) : pricing.input}/$${pricing.output < 1 ? pricing.output.toFixed(2) : pricing.output}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Select.ItemText>
    </Select.Item>
  );
}

const BADGE_STYLES = {
  fast: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    hover: 'hover:bg-green-500/25',
  },
  reasoning: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:bg-purple-500/25',
  },
  vision: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/25' },
  tools: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    hover: 'hover:bg-orange-500/25',
  },
} as const;

function CapabilityBadge({
  type,
  icon,
  label,
  title,
}: {
  type: keyof typeof BADGE_STYLES;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
}) {
  const style = BADGE_STYLES[type];
  const IconComponent = icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${style.bg} ${style.text} ${style.border} ${style.hover} shadow-sm transition-colors`}
      title={title}
    >
      <IconComponent className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function ModelCapabilityBadges({ model }: { model: ModelInfo }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {model.capabilities.fast && <CapabilityBadge type="fast" icon={Zap} label="Fast" title="Fast Response Time" />}
      {model.capabilities.reasoning && (
        <CapabilityBadge type="reasoning" icon={Brain} label="Reasoning" title="Advanced Reasoning Capabilities" />
      )}
      {model.capabilities.vision && (
        <CapabilityBadge type="vision" icon={Eye} label="Vision" title="Vision & Image Analysis" />
      )}
      {model.capabilities.tools && (
        <CapabilityBadge type="tools" icon={Wrench} label="Tools" title="Tool Use & Function Calling" />
      )}
    </div>
  );
}
