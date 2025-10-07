import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { Coins, MessageSquare,FileOutput } from 'lucide-react';
import { $sessionUsage } from '~/lib/stores/usage';
import { formatNumber } from '~/utils/format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/Tooltip';

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{formatNumber(tokens.input)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Input Tokens</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <FileOutput className="w-3.5 h-3.5" />
              <span>{formatNumber(tokens.output)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Output Tokens</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>${cost.toFixed(4)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session Cost</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}