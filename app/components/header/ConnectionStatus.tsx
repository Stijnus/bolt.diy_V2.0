import { useStore } from '@nanostores/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Cloud, Database, CloudOff, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '~/lib/contexts/AuthContext';
import { connectionStore, setConnected } from '~/lib/stores/connection';

export function ConnectionStatus() {
  const { user } = useAuth();
  const { status, syncing, error } = useStore(connectionStore);

  useEffect(() => {
    setConnected(user?.id || null);
  }, [user?.id]);

  const getStatusConfig = () => {
    if (error) {
      return {
        icon: CloudOff,
        iconColor: 'text-bolt-elements-button-danger-text',
        dotColor: 'bg-bolt-elements-button-danger-text',
        bgColor: 'bg-bolt-elements-button-danger-background',
        borderColor: 'border-bolt-elements-button-danger-backgroundHover',
        label: 'Connection Error',
        description: error,
      };
    }

    if (status === 'supabase') {
      return {
        icon: Cloud,
        iconColor: 'text-bolt-elements-icon-success',
        dotColor: 'bg-bolt-elements-icon-success',
        bgColor: 'bg-bolt-elements-item-backgroundActive',
        borderColor: 'border-bolt-elements-borderColorActive/50',
        label: 'Cloud Storage',
        description: 'Your data is being synced to the cloud',
      };
    }

    if (status === 'indexeddb') {
      return {
        icon: Database,
        iconColor: 'text-bolt-elements-item-contentAccent',
        dotColor: 'bg-bolt-elements-item-contentAccent',
        bgColor: 'bg-bolt-elements-item-backgroundAccent',
        borderColor: 'border-bolt-elements-item-backgroundAccent',
        label: 'Local Storage',
        description: 'Your data is stored locally. Sign in to sync to cloud.',
      };
    }

    return {
      icon: CloudOff,
      iconColor: 'text-bolt-elements-textSecondary',
      dotColor: 'bg-bolt-elements-textSecondary',
      bgColor: 'bg-bolt-elements-background-depth-3',
      borderColor: 'border-bolt-elements-borderColor',
      label: 'Disconnected',
      description: 'No storage available',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border ${config.borderColor} transition-colors cursor-help`}
          >
            <div className="relative">
              {syncing ? (
                <Loader2 className={`w-4 h-4 ${config.iconColor} animate-spin`} />
              ) : (
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
              )}
              <div
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${config.dotColor} rounded-full ${syncing ? 'animate-pulse' : ''}`}
              />
            </div>
            <span className="text-xs font-medium text-bolt-elements-textPrimary">{config.label}</span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg max-w-xs z-[9999]"
            sideOffset={5}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-bolt-elements-textPrimary">{config.label}</p>
              <p className="text-xs text-bolt-elements-textSecondary">{config.description}</p>
              {syncing && <p className="text-xs text-bolt-elements-textSecondary italic mt-2">Syncing data...</p>}
            </div>
            <Tooltip.Arrow className="fill-bolt-elements-background-depth-2" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
