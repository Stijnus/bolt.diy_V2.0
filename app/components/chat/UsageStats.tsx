import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { Coins, MessageSquare, FileOutput } from 'lucide-react';
import { Tooltip } from '~/components/ui/Tooltip';
import { $sessionUsage } from '~/lib/stores/usage';
import { formatNumber } from '~/utils/format';

export function UsageStats() {
  const usage = useStore($sessionUsage);
  const { tokens, cost } = usage;

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