import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HeaderDateTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = format(currentTime, 'HH:mm:ss');
  const dateString = format(currentTime, 'EEE, MMM d, yyyy');

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 shadow-sm">
        <Clock className="h-4 w-4 text-bolt-elements-icon-primary" />
        <span className="text-sm font-semibold tabular-nums text-bolt-elements-textPrimary">{timeString}</span>
      </div>
      <div className="hidden items-center gap-2 rounded-xl border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 shadow-sm lg:flex">
        <Calendar className="h-4 w-4 text-bolt-elements-icon-primary" />
        <span className="text-sm font-medium text-bolt-elements-textPrimary">{dateString}</span>
      </div>
    </div>
  );
}
