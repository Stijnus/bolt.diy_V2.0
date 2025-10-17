import { useStore } from '@nanostores/react';
import { useStore as useNanoStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { Coins, MessageSquare, FileOutput, BadgeInfo } from 'lucide-react';
import { Tooltip } from '~/components/ui/Tooltip';
import { currentModel } from '~/lib/stores/model';
import { $sessionUsage } from '~/lib/stores/usage';
import { formatNumber } from '~/utils/format';

export function UsageStats() {
  const usage = useStore($sessionUsage);
  const { tokens, cost } = usage;
  const model = useNanoStore(currentModel);

  if (tokens.input === 0 && tokens.output === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 text-xs text-bolt-elements-textSecondary"
    >
      <Tooltip content={<p>Model</p>}>
        <div className="hidden sm:flex items-center gap-1 rounded-full border border-bolt-elements-borderColor px-2 py-0.5 text-[10px] uppercase tracking-wide text-bolt-elements-textPrimary bg-bolt-elements-background-depth-1">
          <BadgeInfo className="w-3 h-3" />
          <span>{model.fullId}</span>
        </div>
      </Tooltip>

      <Tooltip content={<p>Input Tokens</p>}>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{formatNumber(tokens.input)}</span>
        </div>
      </Tooltip>

      <Tooltip content={<p>Output Tokens</p>}>
        <div className="flex items-center gap-1.5">
          <FileOutput className="w-3.5 h-3.5" />
          <span>{formatNumber(tokens.output)}</span>
        </div>
      </Tooltip>

      <Tooltip content={<p>Session Cost</p>}>
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" />
          <span>${cost.toFixed(4)}</span>
        </div>
      </Tooltip>
    </motion.div>
  );
}
