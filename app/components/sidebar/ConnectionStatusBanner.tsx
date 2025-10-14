import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, Loader2, WifiOff, CheckCircle2 } from 'lucide-react';
import { connectionStore } from '~/lib/stores/connection';
import { cn } from '~/lib/utils';

export function ConnectionStatusBanner() {
  const connectionState = useStore(connectionStore);
  const isSyncing = connectionState.syncing;
  const error = connectionState.error;

  // Don't show banner if everything is fine
  if (!isSyncing && !error) {
    return null;
  }

  const getStatusConfig = () => {
    if (error) {
      return {
        icon: error.includes('offline') ? WifiOff : CloudOff,
        text: 'Sync failed',
        subtext: error,
        className: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
        iconClassName: 'text-red-600 dark:text-red-400',
      };
    }

    if (isSyncing) {
      return {
        icon: Loader2,
        text: 'Syncing',
        subtext: 'Saving to cloud...',
        className: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
        iconClassName: 'text-blue-600 dark:text-blue-400 animate-spin',
      };
    }

    return {
      icon: CheckCircle2,
      text: 'Synced',
      subtext: 'All changes saved',
      className: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
      iconClassName: 'text-green-600 dark:text-green-400',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden px-5 py-2"
      >
        <div className={cn('flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 shadow-sm', config.className)}>
          <Icon className={cn('h-4 w-4 flex-shrink-0', config.iconClassName)} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">{config.text}</p>
            <p className="mt-0.5 truncate text-[11px] opacity-80">{config.subtext}</p>
          </div>
          {error && (
            <button
              onClick={() => {
                // Retry sync or clear error
                window.location.reload();
              }}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/20"
            >
              Retry
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
