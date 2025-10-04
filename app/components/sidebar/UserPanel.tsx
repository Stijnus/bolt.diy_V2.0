import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '~/lib/contexts/AuthContext'
import { LoginModal } from '~/components/auth/LoginModal'

export function UserPanel() {
  const { user, signOut, loading } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="px-4 py-3 border-t border-bolt-elements-borderColor">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 bg-bolt-elements-background-depth-3 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 bg-bolt-elements-background-depth-3 rounded w-20 mb-1"></div>
            <div className="h-2 bg-bolt-elements-background-depth-3 rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="px-4 py-3 border-t border-bolt-elements-borderColor">
          <button
            onClick={() => setLoginOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover rounded-lg px-4 py-2.5 font-medium transition-all"
          >
            <div className="i-ph:sign-in-bold text-lg" />
            Sign In
          </button>
          <p className="text-xs text-bolt-elements-textTertiary text-center mt-2">
            Sign in to save and sync your projects
          </p>
        </div>
        {typeof document !== 'undefined' && createPortal(
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />,
          document.body
        )}
      </>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setMenuOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="border-t border-bolt-elements-borderColor">
      {/* User Info Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-full px-4 py-3 hover:bg-bolt-elements-sidebar-buttonBackgroundHover transition-all flex items-center gap-3"
      >
        <img
          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=8b5cf6&color=fff&bold=true`}
          alt={user.email || 'User'}
          className="w-9 h-9 rounded-full ring-2 ring-bolt-elements-borderColor"
        />
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-bolt-elements-textPrimary truncate">
            {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-xs text-bolt-elements-textTertiary truncate">{user.email}</div>
        </div>
        <div
          className={`i-ph:caret-${menuOpen ? 'up' : 'down'}-bold text-bolt-elements-textTertiary transition-transform`}
        />
      </button>

      {/* Expanded Menu */}
      {menuOpen && (
        <div className="bg-bolt-elements-background-depth-3 border-t border-bolt-elements-borderColor">
          <div className="p-2 space-y-1">
            <a
              href="/projects"
              className="flex items-center gap-3 px-3 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-sidebar-buttonBackgroundHover rounded-md transition-all group"
            >
              <div className="i-ph:folder-open-duotone text-lg group-hover:scale-110 transition-transform" />
              <span className="font-medium">My Projects</span>
            </a>
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-sidebar-buttonBackgroundHover rounded-md transition-all group"
            >
              <div className="i-ph:house-duotone text-lg group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </a>
            <hr className="border-bolt-elements-borderColor my-2" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-background/10 rounded-md transition-all group"
            >
              <div className="i-ph:sign-out-bold text-lg group-hover:scale-110 transition-transform" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
