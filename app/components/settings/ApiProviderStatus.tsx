import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PROVIDERS } from '~/lib/models.client';
import type { AIProvider } from '~/types/model';
import { classNames } from '~/utils/classNames';

interface ProviderStatus {
  providers: Record<AIProvider, boolean>;
}

export const ApiProviderStatus = () => {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/providers');

      if (!response.ok) {
        throw new Error('Failed to fetch provider status');
      }

      const data = (await response.json()) as ProviderStatus;
      setProviderStatus(data);
    } catch (err) {
      setError('Failed to load provider status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProviderStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Checking API key status...</span>
      </div>
    );
  }

  if (error || !providerStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <XCircle className="w-4 h-4" />
        <span>{error || 'Failed to load provider status'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-bolt-elements-textSecondary">
          API keys are configured in your environment variables. Below is the status of each provider.
        </p>
        <button
          onClick={fetchProviderStatus}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-bolt-elements-textSecondary transition-colors hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
          title="Refresh status"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PROVIDERS.map((provider) => {
          const isConfigured = providerStatus.providers[provider.id as AIProvider];

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
                    {provider.models.length} model{provider.models.length !== 1 ? 's' : ''} available
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
              for changes to take effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
