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
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Connection Error',
        description: error,
      };
    }

    switch (status) {
      case 'supabase': {
        return {
          icon: Cloud,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Cloud Storage',
          description: 'Your data is being synced to the cloud',
        };
      }
      case 'indexeddb': {
        return {
          icon: Database,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          label: 'Local Storage',
          description: 'Your data is stored locally. Sign in to sync to cloud.',
        };
      }
      case 'disconnected': {
        return {
          icon: CloudOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          label: 'Disconnected',
          description: 'No storage available',
        };
      }
      default: {
        return {
          icon: CloudOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          label: 'Unknown Status',
          description: 'Status unknown',
        };
      }
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-colors cursor-help`}
          >
            <div className="relative">
              {syncing ? (
                <Loader2 className={`w-4 h-4 ${config.color} animate-spin`} />
              ) : (
                <Icon className={`w-4 h-4 ${config.color}`} />
              )}
              {/* Status indicator dot */}
              <div
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${config.color.replace('text-', 'bg-')} rounded-full ${syncing ? 'animate-pulse' : ''}`}
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
