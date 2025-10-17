import { ChevronDown, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiProviderStatus } from '~/components/settings/ApiProviderStatus';
import { SettingItem } from '~/components/settings/SettingItem';
import { SettingsSection } from '~/components/settings/SettingsSection';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
import { PROVIDERS } from '~/lib/models.client';
import type { AISettings } from '~/lib/stores/settings';

interface AiAssistantTabProps {
  settings: AISettings;
  onSettingChange: (key: keyof AISettings, value: any) => void;
  onReset: () => void;
  onRevert?: () => void;
  dirty?: boolean;
  errors?: Partial<Record<keyof AISettings, string>>;
}

export function AiAssistantTab({
  settings,
  onSettingChange,
  onReset,
  onRevert,
  dirty = false,
  errors,
}: AiAssistantTabProps) {
  // Fetch configured providers to filter models shown in selectors
  const [enabledProviders, setEnabledProviders] = useState<Set<string> | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/providers');

        if (!res.ok) {
          throw new Error('Failed to load provider status');
        }

        const data: any = await res.json();

        // Expecting shape: { providers: { openai: true, anthropic: false, ... } }
        const set = new Set<string>();

        if (data && (data as any).providers) {
          for (const [k, v] of Object.entries<boolean>((data as any).providers)) {
            if (v) {
              set.add(k);
            }
          }
        }

        if (active) {
          setEnabledProviders(set);
        }
      } catch {
        if (active) {
          setEnabledProviders(null);
        } // fallback to show all
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredProviders = useMemo(() => {
    if (!enabledProviders || enabledProviders.size === 0) {
      return PROVIDERS;
    }

    return PROVIDERS.filter((p) => enabledProviders.has(p.id));
  }, [enabledProviders]);

  const planModel = settings.planModel || 'anthropic:claude-sonnet-4-5-20250929';

  // Ensure current selection remains visible even if provider disabled
  const ensureCurrentOption = (value: string) => {
    const [prov] = value.split(':');
    const providerPresent = filteredProviders.some((p) => p.id === prov);

    if (providerPresent) {
      return null;
    }

    return value;
  };

  const currentPlanIfHidden = ensureCurrentOption(planModel);

  return (
    <SettingsSection
      title="AI Assistant"
      description="Configure AI behavior and model preferences. Choose models directly in the chat interface."
      status="implemented"
      onReset={onReset}
      onRevert={onRevert}
      dirty={dirty}
    >
      <SettingItem
        label="Temperature"
        description="Controls randomness (0-1)"
        tooltip="Lower values (0.0-0.3) make responses more focused and deterministic. Higher values (0.7-1.0) make responses more creative and varied."
        error={errors?.temperature}
      >
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={settings.temperature}
          onChange={(e) => {
            const value = Number.parseFloat(e.target.value);

            if (!Number.isNaN(value)) {
              onSettingChange('temperature', value);
            }
          }}
          className="w-20"
          aria-invalid={Boolean(errors?.temperature)}
        />
      </SettingItem>
      <SettingItem
        label="Max Tokens"
        description="Maximum response length"
        tooltip="Limits the length of AI responses. Higher values allow longer responses but use more resources. 1 token ≈ 4 characters."
        error={errors?.maxTokens}
      >
        <Input
          type="number"
          min={1024}
          max={32768}
          step={1024}
          value={settings.maxTokens}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value, 10);

            if (!Number.isNaN(value)) {
              onSettingChange('maxTokens', value);
            }
          }}
          className="w-24"
          aria-invalid={Boolean(errors?.maxTokens)}
        />
      </SettingItem>
      <SettingItem
        label="Stream Response"
        description="Stream AI responses in real-time"
        tooltip="When enabled, AI responses appear word-by-word as they're generated. When disabled, the full response appears at once."
      >
        <Switch checked={settings.streamResponse} onChange={(checked) => onSettingChange('streamResponse', checked)} />
      </SettingItem>
      <SettingItem
        label="Plan Agent (Plan Mode Model)"
        description="Model used when Plan mode is enabled"
        tooltip="Choose the model used to generate structured plans. A strong planner like Claude Sonnet 4.5 is ideal."
        error={errors?.planModel}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full max-w-xs rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 px-3 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-button-primary-text focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background flex items-center justify-between"
              aria-invalid={Boolean(errors?.planModel)}
            >
              <span className="truncate">
                {(() => {
                  const value = settings.planModel || 'anthropic:claude-sonnet-4-5-20250929';
                  const [prov, modelId] = value.split(':');
                  const provider = PROVIDERS.find((p) => p.id === prov);
                  const model = provider?.models.find((m) => m.id === modelId);

                  return model ? `${model.name}${model.isDefault ? ' (Default)' : ''}` : value;
                })()}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            {/* Show current value even if provider is not configured */}
            {currentPlanIfHidden && (
              <>
                <DropdownMenuLabel>Current (not configured)</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => onSettingChange('planModel', currentPlanIfHidden)}
                  className="flex items-center"
                >
                  {settings.planModel === currentPlanIfHidden && <Check className="w-4 h-4 mr-2" />}
                  {currentPlanIfHidden}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {filteredProviders.map((provider) => (
              <div key={provider.id}>
                <DropdownMenuLabel>{provider.name}</DropdownMenuLabel>
                {provider.models.map((model) => {
                  const value = `${provider.id}:${model.id}`;
                  const isSelected = settings.planModel === value;

                  return (
                    <DropdownMenuItem
                      key={value}
                      onSelect={() => onSettingChange('planModel', value)}
                      className="flex items-center"
                    >
                      {isSelected && <Check className="w-4 h-4 mr-2" />}
                      {model.name} {model.isDefault && '(Default)'}
                    </DropdownMenuItem>
                  );
                })}
                {provider !== filteredProviders[filteredProviders.length - 1] && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SettingItem>

      {/* API Provider Status */}
      <div className="mt-8 pt-8 border-t border-bolt-elements-borderColor">
        <h3 className="mb-4 text-base font-semibold text-bolt-elements-textPrimary">API Provider Status</h3>
        <ApiProviderStatus />
      </div>
    </SettingsSection>
  );
}
