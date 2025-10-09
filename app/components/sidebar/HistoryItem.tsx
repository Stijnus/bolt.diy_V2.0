import { motion } from 'framer-motion';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type ChatHistoryItem } from '~/lib/persistence';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
}

export function HistoryItem({ item, onDelete }: HistoryItemProps) {
  const [hovering, setHovering] = useState(false);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    function mouseEnter() {
      setHovering(true);

      if (timeout) {
        clearTimeout(timeout);
      }
    }

    function mouseLeave() {
      setHovering(false);
    }

    hoverRef.current?.addEventListener('mouseenter', mouseEnter);
    hoverRef.current?.addEventListener('mouseleave', mouseLeave);

    return () => {
      hoverRef.current?.removeEventListener('mouseenter', mouseEnter);
      hoverRef.current?.removeEventListener('mouseleave', mouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={hoverRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <a
        href={`/chat/${item.urlId}`}
        className="flex items-center gap-3 rounded-xl border border-transparent bg-bolt-elements-background-depth-1/50 px-3 py-2.5 text-sm text-bolt-elements-textSecondary transition-all hover:border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1 hover:text-bolt-elements-textPrimary hover:shadow-sm"
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0 text-bolt-elements-textTertiary transition-colors group-hover:text-bolt-elements-icon-primary" />
        <span className="min-w-0 flex-1 truncate">{item.description || item.urlId}</span>
        {hovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-bolt-elements-textTertiary transition-all hover:bg-bolt-elements-button-danger-background/10 hover:text-bolt-elements-button-danger-text"
              onClick={(event) => {
                event.preventDefault();
                onDelete?.(event);
              }}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </a>
    </motion.div>
  );
}
