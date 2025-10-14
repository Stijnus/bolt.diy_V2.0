import { cn } from '~/lib/utils';

interface HistoryItemSkeletonProps {
  count?: number;
}

export function HistoryItemSkeleton({ count = 5 }: HistoryItemSkeletonProps) {
  return (
    <div className="space-y-2 px-3 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-transparent bg-bolt-elements-background-depth-1/50 px-3 py-2.5"
        >
          {/* Icon skeleton */}
          <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded-md bg-bolt-elements-background-depth-3" />

          {/* Content skeleton */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title */}
            <div
              className={cn(
                'h-3 animate-pulse rounded-md bg-bolt-elements-background-depth-3',
                i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-2/3' : 'w-4/5',
              )}
            />
            {/* Metadata */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 animate-pulse rounded-md bg-bolt-elements-background-depth-3" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-bolt-elements-background-depth-3" />
              <div className="h-2 w-12 animate-pulse rounded-md bg-bolt-elements-background-depth-3" />
            </div>
          </div>

          {/* Action skeleton */}
          <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-lg bg-bolt-elements-background-depth-3" />
        </div>
      ))}
    </div>
  );
}
