import { memo } from 'react';

export const SidebarLogo = memo(() => {
  return (
    <div className="flex items-center justify-center px-6 py-4">
      <a
        href="/"
        className="flex items-center gap-2 text-bolt-elements-textPrimary hover:opacity-80 transition-opacity"
      >
        <div className="text-xl font-bold">
          <span className="text-primary">BoltDIY</span>
          <span className="text-bolt-elements-textSecondary">V2.0</span>
        </div>
      </a>
    </div>
  );
});
