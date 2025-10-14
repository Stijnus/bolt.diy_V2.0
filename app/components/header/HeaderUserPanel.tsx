import { ChevronDown, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '~/lib/contexts/AuthContext';
import { cn } from '~/lib/utils';
import { getAvatarUrl } from '~/utils/avatar';

interface HeaderUserPanelProps {
  onRequestAuth?: () => void;
}

export function HeaderUserPanel({ onRequestAuth }: HeaderUserPanelProps) {
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-bolt-elements-background-depth-3"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={onRequestAuth}
        className="flex items-center gap-2 rounded-xl border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary shadow-sm transition-all hover:border-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-background hover:text-bolt-elements-button-primary-text hover:shadow-md"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-3 rounded-xl border-2 px-3 py-2 transition-all',
          menuOpen
            ? 'border-bolt-elements-button-primary-background bg-bolt-elements-background-depth-2 shadow-md'
            : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 hover:border-bolt-elements-borderColorActive hover:shadow-sm',
        )}
        aria-expanded={menuOpen}
        aria-label="User menu"
      >
        <img
          src={getAvatarUrl(user)}
          alt={user.email || 'User'}
          className="h-7 w-7 rounded-full ring-2 ring-bolt-elements-borderColor"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=8b5cf6&color=fff&bold=true`;
          }}
        />
        <div className="hidden text-left lg:block">
          <div className="text-xs font-medium text-bolt-elements-textPrimary">
            {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
          </div>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-bolt-elements-textTertiary transition-transform', menuOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[998]" onClick={() => setMenuOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full z-[999] mt-2 w-64 rounded-xl border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-2xl">
            {/* User Info */}
            <div className="border-b border-bolt-elements-borderColor px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.email || 'User'}
                  className="h-10 w-10 rounded-full ring-2 ring-bolt-elements-borderColor"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=8b5cf6&color=fff&bold=true`;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-bolt-elements-textPrimary">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="truncate text-xs text-bolt-elements-textTertiary">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bolt-elements-textSecondary">Account Status</span>
                <span className="flex items-center gap-1.5 font-medium text-bolt-elements-icon-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-bolt-elements-icon-success"></span>
                  Active
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <div className="border-t border-bolt-elements-borderColor p-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bolt-elements-textSecondary transition-all hover:bg-bolt-elements-button-danger-background/10 hover:text-bolt-elements-button-danger-text"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
