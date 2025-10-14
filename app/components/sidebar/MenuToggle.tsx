import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft, X } from 'lucide-react';
import { cn } from '~/lib/utils';

interface MenuToggleProps {
  isOpen: boolean;
  onClick: () => void;
  showEdgeIndicator?: boolean;
}

export function MenuToggle({ isOpen, onClick, showEdgeIndicator = false }: MenuToggleProps) {
  return (
    <>
      {/* Edge activation indicator */}
      <AnimatePresence>
        {showEdgeIndicator && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="pointer-events-none fixed left-0 top-1/2 z-[996] h-32 w-1 -translate-y-1/2 bg-gradient-to-r from-bolt-elements-button-primary-background/50 to-transparent blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={onClick}
        initial={false}
        animate={{
          left: isOpen ? '352px' : '8px',
        }}
        transition={{
          duration: 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className={cn(
          'fixed top-4 z-[998] flex h-10 w-10 items-center justify-center rounded-xl border-2 shadow-lg transition-all hover:scale-105 active:scale-95',
          isOpen
            ? 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive'
            : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:border-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-background hover:text-bolt-elements-button-primary-text hover:shadow-xl',
        )}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
      >
        <motion.div initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </motion.div>
      </motion.button>

      {/* Keyboard hint tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: 1 }}
            className="fixed left-16 top-4 z-[998] hidden rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 shadow-lg backdrop-blur-sm lg:block"
          >
            <div className="flex items-center gap-2 text-xs text-bolt-elements-textSecondary">
              <span>Toggle sidebar</span>
              <kbd className="rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-1.5 py-0.5 font-mono text-[10px]">
                ⌘ B
              </kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
