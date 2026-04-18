import { AnimatePresence, cubicBezier, motion } from 'framer-motion';
import { ArrowRight, StopCircle } from 'lucide-react';
import { Button } from '~/components/ui/Button';

interface SendButtonProps {
  show: boolean;
  isStreaming?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const customEasingFn = cubicBezier(0.4, 0, 0.2, 1);

export function SendButton({ show, isStreaming, onClick }: SendButtonProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="absolute top-[18px] right-[22px]"
          transition={{ ease: customEasingFn, duration: 0.17 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Button
            variant={isStreaming ? 'danger' : 'primary'}
            size="icon"
            className="h-[34px] w-[34px] rounded-md"
            onClick={(event) => {
              event.preventDefault();
              onClick?.(event);
            }}
          >
            {!isStreaming ? <ArrowRight className="w-5 h-5" /> : <StopCircle className="w-5 h-5" />}
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
