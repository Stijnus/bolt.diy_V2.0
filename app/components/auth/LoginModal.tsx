import { useState } from 'react'
import { useAuth } from '~/lib/contexts/AuthContext'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp, signInWithGitHub, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
      // Reset form
      setEmail('')
      setPassword('')
      setMode('signin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setError(null)
      if (provider === 'github') {
        await signInWithGitHub()
      } else {
        await signInWithGoogle()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-bolt-elements-borderColor">
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            <div className="i-ph:x text-2xl" />
          </button>
        </div>

        <div className="p-6">

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('github')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text border border-bolt-elements-borderColor rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-medium">Continue with GitHub</span>
            </button>
            <button
              onClick={() => handleOAuthSignIn('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text border border-bolt-elements-borderColor rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-bolt-elements-borderColor"></div>
            <span className="px-4 text-sm text-bolt-elements-textTertiary font-medium">or</span>
            <div className="flex-1 h-px bg-bolt-elements-borderColor"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary rounded-lg focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background focus:border-transparent transition-all placeholder:text-bolt-elements-textTertiary"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary rounded-lg focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background focus:border-transparent transition-all placeholder:text-bolt-elements-textTertiary"
                required
                minLength={6}
              />
              <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">Minimum 6 characters</p>
            </div>

            {error && (
              <div className="bg-bolt-elements-button-danger-background/10 border border-bolt-elements-button-danger-background text-bolt-elements-button-danger-text text-sm rounded-lg p-3 flex items-start gap-2">
                <div className="i-ph:warning-circle-fill text-lg flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text py-3 rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="i-ph:spinner animate-spin text-lg" />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === 'signin' ? (
              <p className="text-bolt-elements-textSecondary">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-bolt-elements-button-primary-background hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-bolt-elements-textSecondary">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-bolt-elements-button-primary-background hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}