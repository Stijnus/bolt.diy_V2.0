import { ChevronDown, ChevronUp, HelpCircle, LogIn, LogOut, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '~/components/ui/Button';
import { useAuth } from '~/lib/contexts/AuthContext';
import { getAvatarUrl } from '~/utils/avatar';

interface UserPanelProps {
  onRequestAuth?: () => void;
}

export function UserPanel({ onRequestAuth }: UserPanelProps) {
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAuthRequest = () => {
    onRequestAuth?.();
  };

  if (loading) {
    return (
      <div className="border-t border-bolt-elements-borderColor px-5 py-4">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-bolt-elements-background-depth-3"></div>
          <div className="flex-1">
            <div className="mb-2 h-3 w-20 rounded bg-bolt-elements-background-depth-3"></div>
            <div className="h-2 w-32 rounded bg-bolt-elements-background-depth-3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="border-t border-bolt-elements-borderColor bg-gradient-to-b from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 px-5 py-5">
          <div className="relative overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 p-5 shadow-sm">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-bolt-elements-button-primary-background/10 blur-2xl"></div>
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-bolt-elements-button-primary-background/5 blur-xl"></div>

            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-bolt-elements-button-primary-background to-bolt-elements-button-primary-backgroundHover shadow-lg shadow-bolt-elements-button-primary-background/20">
                <Sparkles className="h-6 w-6 text-bolt-elements-button-primary-text" />
              </div>

              <h3 className="mb-2 text-center text-sm font-semibold text-bolt-elements-textPrimary">
                Unlock the full experience
              </h3>
              <p className="mb-4 text-center text-xs leading-relaxed text-bolt-elements-textSecondary">
                Sign in to save your conversations, sync projects across devices, and collaborate with your team.
              </p>

              <Button onClick={handleAuthRequest} className="w-full shadow-sm" size="md">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>

              <p className="mt-3 text-center text-xs text-bolt-elements-textTertiary">
                New user?{' '}
                <button
                  onClick={handleAuthRequest}
                  className="font-medium text-bolt-elements-button-primary-text transition-colors hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>
          </div>
          
          {/* Help Section for non-authenticated users */}
          <div className="mt-4 flex justify-center">
            <a
              href="https://stijnus.github.io/bolt.diy_V2.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-bolt-elements-textSecondary transition-all hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Documentation
            </a>
          </div>
        </div>
      </>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="border-t border-bolt-elements-borderColor">
      {/* User Info Button */}
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="group flex w-full items-center gap-3 border-t border-transparent px-5 py-4 text-left transition-all hover:bg-bolt-elements-sidebar-buttonBackgroundHover"
        aria-expanded={menuOpen}
        aria-label="User menu"
      >
        <div className="relative">
          <img
            src={getAvatarUrl(user)}
            alt={user.email || 'User'}
            className="h-10 w-10 rounded-full ring-2 ring-bolt-elements-borderColor transition-all group-hover:ring-bolt-elements-borderColorActive"
            onError={(e) => {
              // fallback to generated avatar if the original fails to load
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=8b5cf6&color=fff&bold=true`;
            }}
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bolt-elements-background-depth-2 bg-bolt-elements-icon-success"></div>
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium text-bolt-elements-textPrimary">
            {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="truncate text-xs text-bolt-elements-textTertiary">{user.email}</div>
        </div>
        {menuOpen ? (
          <ChevronUp className="h-4 w-4 text-bolt-elements-textTertiary transition-transform" />
        ) : (
          <ChevronDown className="h-4 w-4 text-bolt-elements-textTertiary transition-transform" />
        )}
      </button>

      {/* Expanded Menu */}
      {menuOpen && (
        <div className="border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 px-3 py-3">
          <a
            href="/settings"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-bolt-elements-textSecondary transition-all hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
          >
            <Settings className="h-4 w-4" />
            Settings
          </a>
          <a
            href="https://stijnus.github.io/bolt.diy_V2.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-bolt-elements-textSecondary transition-all hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
          >
            <HelpCircle className="h-4 w-4" />
            Help & Documentation
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-bolt-elements-textSecondary transition-all hover:bg-bolt-elements-button-danger-background/10 hover:text-bolt-elements-button-danger-text mt-1"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
