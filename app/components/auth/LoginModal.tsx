import { Github, ArrowLeft, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ResetPasswordForm } from '~/components/auth/forms/ResetPasswordForm';
import { SignInForm } from '~/components/auth/forms/SignInForm';
import { SignUpForm } from '~/components/auth/forms/SignUpForm';
import { type ResetFormValues, type SignInFormValues, type SignUpFormValues } from '~/components/auth/forms/schemas';
import { Button } from '~/components/ui/Button';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { useAuth } from '~/lib/contexts/AuthContext';
import { classNames } from '~/utils/classNames';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp, signInWithGitHub, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [signInDefaults, setSignInDefaults] = useState<SignInFormValues>({ email: '', password: '' });
  const [signUpDefaults, setSignUpDefaults] = useState<SignUpFormValues>({ email: '', password: '' });
  const [resetDefaults, setResetDefaults] = useState<ResetFormValues>({ email: '' });

  useEffect(() => {
    if (!open) {
      setMode('signin');
      setLoading(false);
      setError(null);
      setResetSuccess(false);
      setSignInDefaults({ email: '', password: '' });
      setSignUpDefaults({ email: '', password: '' });
      setResetDefaults({ email: '' });
    }
  }, [open]);

  useEffect(() => {
    setError(null);

    if (mode !== 'reset') {
      setResetSuccess(false);
    }
  }, [mode]);

  const modeCopy = useMemo(() => {
    if (mode === 'signup') {
      return {
        heading: 'Create your account',
        subheading: 'Get started with your secure workspace.',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in',
        switchTarget: 'signin' as const,
      };
    }

    if (mode === 'reset') {
      return {
        heading: 'Reset your password',
        subheading: "We'll email you a secure link to create a new password.",
        switchPrompt: 'Remembered your password?',
        switchAction: 'Back to sign in',
        switchTarget: 'signin' as const,
      };
    }

    return {
      heading: 'Welcome back',
      subheading: 'Sign in to access your account.',
      switchPrompt: 'New to BoltDIY?',
      switchAction: 'Create an account',
      switchTarget: 'signup' as const,
    };
  }, [mode]);

  const handleSignInValuesChange = useCallback((values: SignInFormValues) => {
    setSignInDefaults((prev) => {
      const next = {
        email: values.email ?? '',
        password: values.password ?? '',
      };
      return prev.email === next.email && prev.password === next.password ? prev : next;
    });
  }, []);

  const handleSignUpValuesChange = useCallback((values: SignUpFormValues) => {
    setSignUpDefaults((prev) => {
      const next = {
        email: values.email ?? '',
        password: values.password ?? '',
      };
      return prev.email === next.email && prev.password === next.password ? prev : next;
    });
  }, []);

  const handleResetValuesChange = useCallback((values: ResetFormValues) => {
    setResetDefaults((prev) => {
      const next = {
        email: values.email ?? '',
      };
      return prev.email === next.email ? prev : next;
    });
  }, []);

  const handleSignInSubmit = useCallback(
    async (values: SignInFormValues) => {
      setError(null);
      setLoading(true);
      setResetSuccess(false);

      try {
        await signIn(values.email, values.password);
        onClose();
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [onClose, signIn],
  );

  const handleSignUpSubmit = useCallback(
    async (values: SignUpFormValues) => {
      setError(null);
      setLoading(true);
      setResetSuccess(false);

      try {
        await signUp(values.email, values.password);
        onClose();
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [onClose, signUp],
  );

  const handleResetSubmit = useCallback(
    async (values: ResetFormValues) => {
      setError(null);
      setLoading(true);
      setResetSuccess(false);

      try {
        await resetPassword(values.email);
        setResetSuccess(true);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to send reset link right now. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [resetPassword],
  );

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError(null);

    try {
      if (provider === 'github') {
        await signInWithGitHub();
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to sign in with that provider right now.');
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <Dialog className="relative max-w-3xl md:max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 animate-slideInFromBottom">
          <div className="relative grid gap-0 md:grid-cols-[1.05fr,1fr]">
            <aside className="relative hidden flex-col justify-center overflow-hidden border-r border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 md:flex">
              <div className="text-center">
                <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-1">
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-white dark:bg-gray-800">
                    <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mode === 'signup' ? 'Welcome to BoltDIY' : 'Welcome Back'}
                </h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'signup'
                    ? 'Create your account to get started with your secure workspace.'
                    : 'Sign in to access your workspace and continue where you left off.'}
                </p>
              </div>
            </aside>

            <main
              className="flex flex-col gap-6 p-6 md:p-8 animate-slideInFromBottom"
              style={{ animationDelay: '0.2s' }}
            >
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              )}

              <DialogTitle
                className="flex flex-col gap-3 border-none p-0 text-left text-2xl font-semibold leading-tight text-gray-900 md:text-[28px] animate-slideInFromBottom dark:text-white"
                style={{ animationDelay: '0.3s' }}
              >
                <span>{modeCopy.heading}</span>
                <span className="text-base font-normal text-gray-600 md:text-lg dark:text-gray-400">
                  {modeCopy.subheading}
                </span>
              </DialogTitle>

              {mode !== 'reset' && (
                <div className="flex flex-col gap-2 animate-slideInFromBottom" style={{ animationDelay: '0.4s' }}>
                  <div className="inline-flex w-full items-center rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                    {(['signin', 'signup'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMode(item)}
                        className={classNames(
                          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                          {
                            'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white': mode === item,
                            'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100':
                              mode !== item,
                          },
                        )}
                      >
                        {item === 'signin' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode !== 'reset' && (
                <div className="space-y-3 animate-slideInFromBottom" style={{ animationDelay: '0.5s' }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => handleOAuth('github')}
                  >
                    <Github className="h-5 w-5" />
                    <span className="flex-1 text-left">Continue with GitHub</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => handleOAuth('google')}
                  >
                    <GoogleIcon className="h-5 w-5" />
                    <span className="flex-1 text-left">Continue with Google</span>
                  </Button>

                  <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        or continue with email
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <div className="animate-slideInFromBottom" style={{ animationDelay: '0.8s' }}>
                  <SignInForm
                    loading={loading}
                    error={error}
                    open={open}
                    onSubmit={handleSignInSubmit}
                    onForgotPassword={() => setMode('reset')}
                    initialValues={signInDefaults}
                    onValuesChange={handleSignInValuesChange}
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="animate-slideInFromBottom" style={{ animationDelay: '0.8s' }}>
                  <SignUpForm
                    loading={loading}
                    error={error}
                    open={open}
                    onSubmit={handleSignUpSubmit}
                    initialValues={signUpDefaults}
                    onValuesChange={handleSignUpValuesChange}
                  />
                </div>
              )}

              {mode === 'reset' && (
                <div className="animate-slideInFromBottom" style={{ animationDelay: '0.8s' }}>
                  <ResetPasswordForm
                    loading={loading}
                    error={error}
                    success={resetSuccess}
                    open={open}
                    onSubmit={handleResetSubmit}
                    initialValues={resetDefaults}
                    onValuesChange={handleResetValuesChange}
                  />
                </div>
              )}

              <div
                className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600 animate-slideInFromBottom dark:bg-gray-800 dark:text-gray-400"
                style={{ animationDelay: '0.9s' }}
              >
                <span>{modeCopy.switchPrompt}</span>
                <button
                  type="button"
                  onClick={() => setMode(modeCopy.switchTarget)}
                  className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {modeCopy.switchAction}
                </button>
              </div>
            </main>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
