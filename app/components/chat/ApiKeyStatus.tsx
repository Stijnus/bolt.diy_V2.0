import { useStore } from '@nanostores/react';
import { ExternalLink, Save, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { getKey as getLocalKey, setKey as setLocalKey, type ProviderKey } from '~/lib/client/api-keys';
import { currentModel } from '~/lib/stores/model';
import type { AIProvider } from '~/types/model';

interface ApiKeyStatusProps {
  provider?: AIProvider;
}

const PROVIDER_DISPLAY: Record<AIProvider, { name: string; docs: string }> = {
  anthropic: { name: 'Anthropic', docs: 'https://console.anthropic.com/settings/keys' },
  openai: { name: 'OpenAI', docs: 'https://platform.openai.com/api-keys' },
  google: { name: 'Google (Gemini)', docs: 'https://aistudio.google.com/app/apikey' },
  deepseek: { name: 'DeepSeek', docs: 'https://platform.deepseek.com/api_keys' },
  xai: { name: 'xAI (Grok)', docs: 'https://console.x.ai/' },
  mistral: { name: 'Mistral', docs: 'https://console.mistral.ai/api-keys/' },
  zai: { name: 'ZAI (GLM)', docs: 'https://z.ai/manage-apikey/apikey-list' },
  groq: { name: 'Groq', docs: 'https://console.groq.com/keys' },
};

export const ApiKeyStatus = memo(({ provider: propProvider }: ApiKeyStatusProps) => {
  const model = useStore(currentModel);
  const provider = (propProvider || model.provider) as AIProvider;
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const display = PROVIDER_DISPLAY[provider];
  const localKey = useMemo(() => getLocalKey(provider as ProviderKey), [provider]);

  useEffect(() => {
    // Load server status once
    fetch('/api/providers')
      .then((res) => res.json() as Promise<{ providers?: Record<string, boolean> }>)
      .then((data) => {
        setServerConfigured(!!data?.providers?.[provider]);
      })
      .catch(() => setServerConfigured(false));
  }, [provider]);

  const isSet = !!localKey || !!serverConfigured;

  return (
    <div className="flex flex-col gap-3 px-6 py-4 rounded-2xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-bolt-elements-textPrimary">{display.name} API Key</span>
          {isSet ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-bolt-elements-icon-error">
              <span className="w-2 h-2 rounded-full bg-bolt-elements-icon-error" /> Not configured
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={display.docs}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-3 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Get API key
          </a>
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-3 transition-colors"
            onClick={() => {
              setValue(localKey || '');
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Paste API key"
            className="flex-1 h-9 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:opacity-90"
            onClick={() => {
              const v = value.trim();
              setLocalKey(provider as ProviderKey, v || undefined);
              setEditing(false);
            }}
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-3"
            onClick={() => setEditing(false)}
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}

      {/* Helper text */}
      {!isSet && (
        <p className="text-xs text-bolt-elements-textSecondary">
          Add a temporary API key locally (stored in your browser). If you prefer, set it in your .env.local for
          server-side usage.
        </p>
      )}
    </div>
  );
});
