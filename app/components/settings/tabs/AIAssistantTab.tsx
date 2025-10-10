import { ApiProviderStatus } from '~/components/settings/ApiProviderStatus';
import { SettingItem } from '~/components/settings/SettingItem';
import { SettingsSection } from '~/components/settings/SettingsSection';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
import { PROVIDERS } from '~/lib/models.client';
import type { AISettings } from '~/lib/stores/settings';

interface AiAssistantTabProps {
  settings: AISettings;
  onSettingChange: (key: keyof AISettings, value: any) => void;
  onReset: () => void;
}

export function AiAssistantTab({ settings, onSettingChange, onReset }: AiAssistantTabProps) {
  return (
    <SettingsSection
      title="AI Assistant"
      description="Configure AI model and behavior"
      status="implemented"
      onReset={onReset}
    >
      <SettingItem
        label="Temperature"
        description="Controls randomness (0-1)"
        tooltip="Lower values (0.0-0.3) make responses more focused and deterministic. Higher values (0.7-1.0) make responses more creative and varied."
      >
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={settings.temperature}
          onChange={(e) => onSettingChange('temperature', parseFloat(e.target.value))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Max Tokens"
        description="Maximum response length"
        tooltip="Limits the length of AI responses. Higher values allow longer responses but use more resources. 1 token ≈ 4 characters."
      >
        <Input
          type="number"
          min={1024}
          max={32768}
          step={1024}
          value={settings.maxTokens}
          onChange={(e) => onSettingChange('maxTokens', parseInt(e.target.value, 10))}
          className="w-24"
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
        label="Default Model"
        description="Model to use for new chats"
        tooltip="Select which AI model to use by default when starting a new chat. You can always change the model for individual chats."
      >
        <select
          className="w-full max-w-xs rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 px-3 py-2 text-sm text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
          value={settings.defaultModel || 'anthropic:claude-sonnet-4-5-20250929'}
          onChange={(e) => onSettingChange('defaultModel', e.target.value)}
        >
          {PROVIDERS.map((provider) => (
            <optgroup key={provider.id} label={provider.name}>
              {provider.models.map((model) => (
                <option key={`${provider.id}:${model.id}`} value={`${provider.id}:${model.id}`}>
                  {model.name} {model.isDefault && '(Default)'}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </SettingItem>

      {/* API Provider Status */}
      <div className="mt-8 pt-8 border-t border-bolt-elements-borderColor">
        <h3 className="mb-4 text-base font-semibold text-bolt-elements-textPrimary">API Provider Status</h3>
        <ApiProviderStatus />
      </div>
    </SettingsSection>
  );
}
