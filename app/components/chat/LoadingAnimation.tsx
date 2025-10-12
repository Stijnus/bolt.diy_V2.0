import { motion } from 'framer-motion';
import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface LoadingAnimationProps {
  className?: string;
  variant?: 'dots' | 'pulse' | 'wave' | 'shimmer';
}

/**
 * Modern loading animation component with multiple variants
 */
export const LoadingAnimation = memo(({ className, variant = 'wave' }: LoadingAnimationProps) => {
  switch (variant) {
    case 'wave': {
      return <WaveAnimation className={className} />;
    }
    case 'pulse': {
      return <PulseAnimation className={className} />;
    }
    case 'shimmer': {
      return <ShimmerAnimation className={className} />;
    }
    case 'dots':
    default: {
      return <DotsAnimation className={className} />;
    }
  }
});

/**
 * Breathing dots with scale and opacity animation
 */
const DotsAnimation = memo(({ className }: { className?: string }) => {
  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.3 },
    animate: { scale: 1, opacity: 1 },
  };

  return (
    <div className={classNames('inline-flex items-center gap-2', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-bolt-elements-loader-progress rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

/**
 * Wave animation with vertical bounce
 */
const WaveAnimation = memo(({ className }: { className?: string }) => {
  return (
    <div className={classNames('inline-flex items-center gap-1.5', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-1.5 h-8 bg-bolt-elements-loader-progress rounded-full"
          animate={{
            scaleY: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

/**
 * Expanding pulse circles
 */
const PulseAnimation = memo(({ className }: { className?: string }) => {
  return (
    <div className={classNames('relative inline-flex items-center justify-center w-12 h-12', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute w-8 h-8 border-2 border-bolt-elements-loader-progress rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
      <div className="w-3 h-3 bg-bolt-elements-loader-progress rounded-full" />
    </div>
  );
});

/**
 * Shimmer gradient effect
 */
const ShimmerAnimation = memo(({ className }: { className?: string }) => {
  return (
    <div className={classNames('relative inline-flex items-center gap-1 overflow-hidden', className)}>
      <motion.div
        className="flex gap-1"
        animate={{
          x: [-20, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="w-1.5 h-6 bg-gradient-to-b from-transparent via-bolt-elements-loader-progress to-transparent rounded-full"
            style={{
              opacity: index === 2 ? 1 : index === 1 || index === 3 ? 0.6 : 0.3,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
});
