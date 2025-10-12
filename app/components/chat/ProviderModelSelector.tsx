import { useStore } from '@nanostores/react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Zap, Eye, Wrench, Brain, Layers, Target, Cpu, Wind, Gem } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllKeys, buildAuthHeaders, type ProviderKey } from '~/lib/client/api-keys';
import { PROVIDERS, MODELS, getModel } from '~/lib/models.client';
import { chatId } from '~/lib/persistence';
import { chatModels, currentModel, setChatModel, setCurrentModel } from '~/lib/stores/model';
import type { AIProvider, ModelInfo } from '~/types/model';

// Provider icons and styling for visual differentiation
const PROVIDER_CONFIG = {
  anthropic: {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/20',
    gradient: 'from-purple-500/20 to-purple-600/10',
    ring: 'focus-visible:ring-purple-500/50',
    name: 'Anthropic',
  },
  openai: {
    icon: Zap,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    hoverBg: 'hover:bg-green-500/20',
    gradient: 'from-green-500/20 to-green-600/10',
    ring: 'focus-visible:ring-green-500/50',
    name: 'OpenAI',
  },
  google: {
    icon: Layers,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/20',
    gradient: 'from-blue-500/20 to-blue-600/10',
    ring: 'focus-visible:ring-blue-500/50',
    name: 'Google',
  },
  deepseek: {
    icon: Target,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    hoverBg: 'hover:bg-orange-500/20',
    gradient: 'from-orange-500/20 to-orange-600/10',
    ring: 'focus-visible:ring-orange-500/50',
    name: 'DeepSeek',
  },
  xai: {
    icon: Cpu,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    hoverBg: 'hover:bg-cyan-500/20',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    ring: 'focus-visible:ring-cyan-500/50',
    name: 'xAI',
  },
  mistral: {
    icon: Wind,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    hoverBg: 'hover:bg-red-500/20',
    gradient: 'from-red-500/20 to-red-600/10',
    ring: 'focus-visible:ring-red-500/50',
    name: 'Mistral',
  },
  zai: {
    icon: Gem,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    hoverBg: 'hover:bg-yellow-500/20',
    gradient: 'from-yellow-500/20 to-yellow-600/10',
    ring: 'focus-visible:ring-yellow-500/50',
    name: 'ZAI (GLM)',
  },
  openrouter: {
    icon: Layers,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/20',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    ring: 'focus-visible:ring-emerald-500/50',
    name: 'OpenRouter',
  },
  qwen: {
    icon: Cpu,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    hoverBg: 'hover:bg-teal-500/20',
    gradient: 'from-teal-500/20 to-teal-600/10',
    ring: 'focus-visible:ring-teal-500/50',
    name: 'Qwen (DashScope)',
  },
  moonshot: {
    icon: Wind,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    hoverBg: 'hover:bg-pink-500/20',
    gradient: 'from-pink-500/20 to-pink-600/10',
    ring: 'focus-visible:ring-pink-500/50',
    name: 'Moonshot (Kimi)',
  },
  cerebras: {
    icon: Target,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    hoverBg: 'hover:bg-indigo-500/20',
    gradient: 'from-indigo-500/20 to-indigo-600/10',
    ring: 'focus-visible:ring-indigo-500/50',
    name: 'Cerebras',
  },
  groq: {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-600/10',
    ring: 'focus-visible:ring-amber-500/50',
    name: 'Groq',
  },
  together: {
    icon: Layers,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    hoverBg: 'hover:bg-violet-500/20',
    gradient: 'from-violet-500/20 to-violet-600/10',
    ring: 'focus-visible:ring-violet-500/50',
    name: 'Together AI',
  },
  perplexity: {
    icon: Brain,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    hoverBg: 'hover:bg-sky-500/20',
    gradient: 'from-sky-500/20 to-sky-600/10',
    ring: 'focus-visible:ring-sky-500/50',
    name: 'Perplexity AI',
  },
  cohere: {
    icon: Wrench,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    hoverBg: 'hover:bg-fuchsia-500/20',
    gradient: 'from-fuchsia-500/20 to-fuchsia-600/10',
    ring: 'focus-visible:ring-fuchsia-500/50',
    name: 'Cohere',
  },
  fireworks: {
    icon: Zap,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    hoverBg: 'hover:bg-rose-500/20',
    gradient: 'from-rose-500/20 to-rose-600/10',
    ring: 'focus-visible:ring-rose-500/50',
    name: 'Fireworks AI',
  },
} as const;

export function ProviderModelSelector() {
  const model = useStore(currentModel);
  const activeChatId = useStore(chatId);
  const chatModelMap = useStore(chatModels);
  const chatSelection = activeChatId ? chatModelMap[activeChatId] : undefined;

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(model.provider);

  // Runtime models: prefer dynamic lists from /api/models/full when available
  const [runtimeModels, setRuntimeModels] = useState<Record<AIProvider, ModelInfo[]>>({ ...(MODELS as any) });

  // Fetch dynamic model lists using any locally stored API keys (sent via headers)
  useEffect(() => {
    const run = async () => {
      const keys = getAllKeys();
      const headers = buildAuthHeaders(keys as Partial<Record<ProviderKey, string>>);

      try {
        const res = await fetch('/api/models/full', { headers });

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as { modelsByProvider?: Partial<Record<AIProvider, ModelInfo[]>> };

        if (!data || !data.modelsByProvider) {
          return;
        }

        const next = { ...(MODELS as any) } as Record<AIProvider, ModelInfo[]>;

        for (const [p, list] of Object.entries(data.modelsByProvider)) {
          const provider = p as AIProvider;

          if (Array.isArray(list) && list.length > 0) {
            next[provider] = list.map((m) => ({ ...m, provider }));
          }
        }

        setRuntimeModels(next);
      } catch {
        // ignore; fallback to static MODELS
      }
    };

    void run();
  }, []);

  const selectedModelInfo = getModel(model.provider, model.modelId);

  useEffect(() => {
    if (!chatSelection) {
      return;
    }

    if (chatSelection.fullId !== model.fullId) {
      setCurrentModel(chatSelection.provider, chatSelection.modelId);
      setSelectedProvider(chatSelection.provider);
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

  useEffect(() => {
    // Update selected provider when model changes from elsewhere
    setSelectedProvider(model.provider);
  }, [model.provider]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setSelectedProvider(newProvider);

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

  const providerConfig = PROVIDER_CONFIG[selectedProvider];
  const ProviderIcon = providerConfig.icon;
  const modelCount = runtimeModels[selectedProvider]?.length ?? MODELS[selectedProvider]?.length ?? 0;

  return (
    <div className="flex gap-3 items-center w-full">
      {/* Provider Selector */}
      <Select.Root value={selectedProvider} onValueChange={handleProviderChange}>
        <Select.Trigger
          className={`
            group inline-flex items-center gap-2 px-4 py-3 text-sm
            bg-gradient-to-br from-bolt-elements-bg-depth-2 to-bolt-elements-bg-depth-3
            border-2 border-bolt-elements-borderColor
            rounded-xl shadow-sm
            hover:shadow-md hover:border-bolt-elements-borderColorActive
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-borderColorActive
            flex-1
          `}
        >
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
          <Select.Content
            className="overflow-hidden bg-bolt-elements-background-depth-2 border-2 border-bolt-elements-borderColor rounded-xl shadow-2xl z-[9999] min-w-[240px] animate-scaleIn backdrop-blur-xl"
            position="popper"
            sideOffset={8}
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
              ▲
            </Select.ScrollUpButton>
            <Select.Viewport className="p-2 max-h-[400px]">
              {PROVIDERS.map((provider) => (
                <ProviderOption
                  key={provider.id}
                  provider={provider.id as AIProvider}
                  modelCount={
                    runtimeModels[provider.id as AIProvider]?.length ?? MODELS[provider.id as AIProvider]?.length ?? 0
                  }
                />
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
              ▼
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Model Selector (filtered by provider) */}
      <Select.Root value={model.fullId} onValueChange={handleModelChange}>
        <Select.Trigger
          className={`
            group inline-flex items-center gap-2 px-4 py-3 text-sm
            bg-gradient-to-br from-bolt-elements-bg-depth-2 to-bolt-elements-bg-depth-3
            border-2 border-bolt-elements-borderColor
            rounded-xl shadow-sm
            hover:shadow-md hover:border-bolt-elements-borderColorActive
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-borderColorActive
            flex-1
          `}
        >
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
          <Select.Content
            className="overflow-hidden bg-bolt-elements-background-depth-2 border-2 border-bolt-elements-borderColor rounded-xl shadow-2xl z-[9999] min-w-[480px] animate-scaleIn backdrop-blur-xl"
            position="popper"
            sideOffset={8}
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
              ▲
            </Select.ScrollUpButton>
            <Select.Viewport className="p-2 max-h-[400px]">
              {(runtimeModels[selectedProvider] || MODELS[selectedProvider])?.map((modelInfo) => (
                <ModelOption key={`${selectedProvider}:${modelInfo.id}`} model={modelInfo} />
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-default">
              ▼
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function ProviderOption({ provider, modelCount }: { provider: AIProvider; modelCount: number }) {
  const config = PROVIDER_CONFIG[provider];
  const ProviderIcon = config.icon;

  // modelCount provided via props to keep this component pure

  return (
    <Select.Item
      value={provider}
      className="relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer select-none hover:bg-bolt-elements-background-depth-3 focus:bg-bolt-elements-background-depth-3 outline-none transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center group-hover:scale-110 transition-transform">
        <ProviderIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
      </div>

      <Select.ItemText asChild>
        <div className="flex-1">
          <div className="font-semibold text-bolt-elements-textPrimary">{config.name}</div>
          <div className="text-xs text-bolt-elements-textSecondary">{modelCount} models available</div>
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
      className="relative flex flex-col px-4 py-3.5 mb-2 rounded-xl cursor-pointer select-none
        border-2 border-bolt-elements-borderColor
        bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2
        hover:border-bolt-elements-borderColorActive hover:shadow-lg
        focus:border-bolt-elements-borderColorActive focus:shadow-lg
        outline-none transition-all duration-300 group
        hover:scale-[1.01] focus:scale-[1.01]"
    >
      {/* Check Indicator - Top Right Badge */}
      <Select.ItemIndicator className="absolute top-2 right-2 flex-shrink-0 animate-scaleIn">
        <div className="w-6 h-6 rounded-full bg-bolt-elements-button-primary-background border-2 border-bolt-elements-borderColorActive flex items-center justify-center shadow-md">
          <Check className="w-3.5 h-3.5 text-bolt-elements-button-primary-text" />
        </div>
      </Select.ItemIndicator>

      <Select.ItemText asChild>
        <div className="flex-1 min-w-0 pr-8">
          {/* Model Name & Default Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-bolt-elements-textPrimary group-hover:text-bolt-elements-icon-primary transition-colors">
              {model.name}
            </span>
            {model.isDefault && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-bolt-elements-button-primary-background to-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text border border-bolt-elements-borderColorActive shadow-sm">
                Default
              </span>
            )}
          </div>

          {/* Description - 2 lines */}
          <div className="text-sm text-bolt-elements-textSecondary mb-3 line-clamp-2 leading-relaxed">
            {model.description}
          </div>

          {/* Divider */}
          <div className="h-px bg-bolt-elements-borderColor mb-3 opacity-50" />

          {/* Metadata Row: Badges + Pricing */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <ModelCapabilityBadges model={model} />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor">
              <span className="text-xs font-medium text-bolt-elements-textSecondary">
                {pricing ? `$${pricing.input.toFixed(2)}/$${pricing.output.toFixed(2)}` : 'N/A'}
              </span>
              {pricing && <span className="text-[10px] text-bolt-elements-textTertiary">per 1M</span>}
            </div>
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
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-green-500/15 text-green-400 border border-green-500/30 shadow-sm hover:bg-green-500/25 transition-colors"
        title="Fast Response Time"
      >
        <Zap className="w-3 h-3" />
        Fast
      </span>,
    );
  }

  if (model.capabilities.reasoning) {
    badges.push(
      <span
        key="reasoning"
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm hover:bg-purple-500/25 transition-colors"
        title="Advanced Reasoning Capabilities"
      >
        <Brain className="w-3 h-3" />
        Reasoning
      </span>,
    );
  }

  if (model.capabilities.vision) {
    badges.push(
      <span
        key="vision"
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm hover:bg-blue-500/25 transition-colors"
        title="Vision & Image Analysis"
      >
        <Eye className="w-3 h-3" />
        Vision
      </span>,
    );
  }

  if (model.capabilities.tools) {
    badges.push(
      <span
        key="tools"
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm hover:bg-orange-500/25 transition-colors"
        title="Tool Use & Function Calling"
      >
        <Wrench className="w-3 h-3" />
        Tools
      </span>,
    );
  }

  return <div className="flex items-center gap-1.5 flex-wrap">{badges}</div>;
}
