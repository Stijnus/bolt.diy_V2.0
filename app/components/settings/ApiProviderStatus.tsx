import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { classNames } from '~/utils/classNames';

const PROVIDER_CARDS: Array<{ id: string; name: string }> = [
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'xai', name: 'xAI' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'zai', name: 'ZAI (GLM)' },
  { id: 'groq', name: 'Groq' },
];

const providersResponseSchema = z.object({
  providers: z.record(z.string(), z.boolean()),
  lastChecked: z.string().optional(),
});

const modelsResponseSchema = z.object({
  counts: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

export const ApiProviderStatus = () => {
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [modelCounts, setModelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);

    const controller = new AbortController();
    setLoading((prev) => (prev ? prev : false));

    try {
      const [providersRes, modelsRes] = await Promise.all([
        fetch('/api/providers', { signal: controller.signal }),
        fetch('/api/models', { signal: controller.signal }),
      ]);

      if (!providersRes.ok) {
        throw new Error(`Failed to fetch provider status (${providersRes.status})`);
      }

      if (!modelsRes.ok) {
        throw new Error(`Failed to fetch model counts (${modelsRes.status})`);
      }

      const providersJson = await providersRes.json();
      const modelsJson = await modelsRes.json();

      const parsedProviders = providersResponseSchema.safeParse(providersJson);

      if (!parsedProviders.success) {
        throw new Error('Provider status response was not in the expected format');
      }

      const parsedModels = modelsResponseSchema.safeParse(modelsJson);

      if (!parsedModels.success) {
        throw new Error('Model counts response was not in the expected format');
      }

      setProviderStatus(parsedProviders.data.providers);
      setModelCounts(parsedModels.data.counts ?? {});
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }

      setError((err as Error).message || 'Failed to load provider status');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const configuredCount = useMemo(() => Object.values(providerStatus).filter(Boolean).length, [providerStatus]);

  const totalProviders = PROVIDER_CARDS.length;

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    try {
      return new Date(lastUpdated).toLocaleString();
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  if (loading && !isRefreshing && !lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Checking API key status...</span>
      </div>
    );
  }

  if (error && configuredCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <XCircle className="w-4 h-4" />
        <span>{error || 'Failed to load provider status'}</span>
        <button
          type="button"
          className="rounded-lg border border-red-500/40 px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
          onClick={() => void fetchStatus()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm text-bolt-elements-textSecondary">
            API keys are configured in your environment variables. Below is the status of each provider.
          </p>
          <p className="text-xs text-bolt-elements-textTertiary">
            {configuredCount}/{totalProviders} providers configured
            {lastUpdatedLabel && ` • Last checked ${lastUpdatedLabel}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchStatus()}
          className={classNames(
            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            isRefreshing
              ? 'text-bolt-elements-textSecondary cursor-wait'
              : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-button-primary-text',
          )}
          title="Refresh status"
          disabled={isRefreshing}
        >
          <RefreshCw className={classNames('h-4 w-4', isRefreshing ? 'animate-spin' : '')} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PROVIDER_CARDS.map((provider) => {
          const isConfigured = !!providerStatus[provider.id];
          const count = modelCounts[provider.id];

          return (
            <div
              key={provider.id}
              className={classNames(
                'flex items-center justify-between rounded-lg border p-4 transition-colors',
                isConfigured
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-bolt-elements-borderColor/50 bg-bolt-elements-background-depth-2',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={classNames(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isConfigured ? 'bg-green-500/10' : 'bg-bolt-elements-background-depth-3',
                  )}
                >
                  {isConfigured ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-bolt-elements-textTertiary" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">{provider.name}</h3>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {typeof count === 'number'
                      ? `${count} model${count !== 1 ? 's' : ''} available`
                      : 'Model count unavailable'}
                  </p>
                </div>
              </div>
              <span
                className={classNames(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isConfigured
                    ? 'bg-green-500/10 text-green-600 dark:text-green-500'
                    : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary',
                )}
              >
                {isConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-500">How to configure API keys</h4>
            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-500/80">
              Set your API keys as environment variables in your <code>.env.local</code> file. For example:{' '}
              <code>ANTHROPIC_API_KEY=sk-ant-api03-xxxxx</code>. After adding new keys, restart the development server
              for changes to take effect. Missing providers can result in limited model availability above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
