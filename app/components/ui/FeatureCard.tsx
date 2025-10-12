import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

interface FeatureCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: boolean;
  delay?: number;
  compact?: boolean;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    { className, icon: iconComponent, title, description, gradient = false, delay = 0, compact = false, ...props },
    ref,
  ) => {
    const Icon = iconComponent;
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          'group relative overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 transition-all duration-300',
          'hover:border-bolt-elements-borderColorActive hover:shadow-lg',
          compact ? 'rounded-xl p-4 hover:-translate-y-0.5' : 'rounded-2xl p-6 hover:-translate-y-1',
          gradient &&
            'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
          compact ? 'before:rounded-xl' : 'before:rounded-2xl',
          className,
        )}
        {...props}
      >
        <div className="relative z-10">
          <div
            className={cn(
              'flex items-center justify-center transition-all duration-300',
              'bg-bolt-elements-button-primary-background text-bolt-elements-icon-primary',
              'group-hover:scale-110 group-hover:rotate-3',
              compact ? 'mb-3 h-10 w-10 rounded-lg' : 'mb-4 h-12 w-12 rounded-xl',
            )}
          >
            <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
          </div>

          <h3
            className={cn(
              'font-semibold text-bolt-elements-textPrimary',
              compact ? 'mb-1.5 text-base' : 'mb-2 text-lg',
            )}
          >
            {title}
          </h3>

          <p className={cn('leading-relaxed text-bolt-elements-textSecondary', compact ? 'text-xs' : 'text-sm')}>
            {description}
          </p>
        </div>

        {gradient && (
          <div
            className={cn(
              'pointer-events-none absolute rounded-full bg-primary/10 blur-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100',
              compact ? '-right-6 -top-6 h-24 w-24' : '-right-8 -top-8 h-32 w-32',
            )}
          />
        )}
      </motion.div>
    );
  },
);

FeatureCard.displayName = 'FeatureCard';
