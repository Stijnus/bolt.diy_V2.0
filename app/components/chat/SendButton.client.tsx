import { cubicBezier, motion } from 'framer-motion';
import { ArrowRight, StopCircle } from 'lucide-react';

interface SendButtonProps {
  show: boolean;
  isStreaming?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const customEasingFn = cubicBezier(0.4, 0, 0.2, 1);

export function SendButton({ show, isStreaming, onClick }: SendButtonProps) {
  return (
    <motion.button
      className={`
        absolute flex justify-center items-center top-1/2 -translate-y-1/2 right-[22px]
        w-[44px] h-[44px] rounded-full
        transition-all duration-300
        group
        ${
          isStreaming
            ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
            : 'bg-gradient-to-br from-bolt-elements-icon-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-lg shadow-blue-500/30'
        }
        hover:scale-110 hover:shadow-2xl
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-borderColorActive focus-visible:ring-offset-2
        ${!show ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}
      `}
      transition={{ ease: customEasingFn, duration: 0.3 }}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      <div className="relative">
        {!isStreaming ? (
          <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform" />
        ) : (
          <StopCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        )}
      </div>

      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:animate-ping" />
    </motion.button>
  );
}
