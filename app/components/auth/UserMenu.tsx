import { useState } from 'react'
import { useAuth } from '~/lib/contexts/AuthContext'
import { LoginModal } from './LoginModal'

export function UserMenu() {
  const { user, signOut, loading } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setLoginOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Sign In
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
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
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
      >
        <img
          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=6366f1&color=fff`}
          alt={user.email || 'User'}
          className="w-8 h-8 rounded-full"
        />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <>
          {/* Overlay to close menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setMenuOpen(false)}
          ></div>
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-3 border-b">
              <div className="text-sm font-medium text-gray-900">
                {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            
            <div className="p-1">
              <a
                href="/projects"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                My Projects
              </a>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}