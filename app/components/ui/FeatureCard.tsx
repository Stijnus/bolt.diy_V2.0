import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: boolean;
  delay?: number;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon: Icon, title, description, gradient = false, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6 transition-all duration-300',
          'hover:border-bolt-elements-borderColorActive hover:shadow-lg hover:-translate-y-1',
          gradient &&
            'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
          className,
        )}
        {...props}
      >
        <div className="relative z-10">
          <div
            className={cn(
              'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
              'bg-bolt-elements-button-primary-background text-bolt-elements-icon-primary',
              'group-hover:scale-110 group-hover:rotate-3',
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-bolt-elements-textPrimary">{title}</h3>

          <p className="text-sm leading-relaxed text-bolt-elements-textSecondary">{description}</p>
        </div>

        {gradient && (
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
        )}
      </motion.div>
    );
  },
);

FeatureCard.displayName = 'FeatureCard';
