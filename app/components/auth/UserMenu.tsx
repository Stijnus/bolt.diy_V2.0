import { ChevronDown, FolderOpen, Home, LogOut } from 'lucide-react';
import { useState } from 'react';

import { LoginModal } from './LoginModal';
import { getAvatarUrl } from '~/utils/avatar';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { useAuth } from '~/lib/contexts/AuthContext';
import { classNames } from '~/utils/classNames';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-10 rounded-full bg-bolt-elements-background-depth-3"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Button onClick={() => setLoginOpen(true)} size="md" className="shadow-sm">
          Sign In
        </Button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
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
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={classNames(
            'group flex items-center gap-2.5 rounded-full border border-transparent bg-bolt-elements-background-depth-2 px-2 py-1.5 pr-3 shadow-sm transition-all hover:border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            {
              'border-bolt-elements-borderColorActive ring-2 ring-primary ring-offset-2 ring-offset-background':
                menuOpen,
            },
          )}
          aria-label="User menu"
        >
          <div className="relative">
            <img
              src={getAvatarUrl(user, '6366f1')}
              alt={user.email || 'User'}
              className="h-9 w-9 flex-shrink-0 rounded-full border border-bolt-elements-borderColor/60 object-cover transition-all group-hover:border-bolt-elements-borderColorActive"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-bolt-elements-background-depth-2 bg-bolt-elements-icon-success"></div>
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <div className="truncate text-sm font-medium text-bolt-elements-textPrimary">
              {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
            </div>
            <div className="truncate text-xs text-bolt-elements-textSecondary">{user.email}</div>
          </div>
          <ChevronDown
            className={classNames('h-4 w-4 text-bolt-elements-textSecondary transition-transform duration-200', {
              'rotate-180': menuOpen,
            })}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-3">
          <span className="text-base font-bold text-bolt-elements-textPrimary">
            {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
          </span>
          <span className="text-sm text-bolt-elements-textSecondary">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem asChild>
          <a href="/projects" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium">
            <FolderOpen className="h-5 w-5" />
            My Projects
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium">
            <Home className="h-5 w-5" />
            Home
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
