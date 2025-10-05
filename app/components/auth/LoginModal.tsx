import { Github, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ResetPasswordForm } from '~/components/auth/forms/ResetPasswordForm';
import { SignInForm } from '~/components/auth/forms/SignInForm';
import { SignUpForm } from '~/components/auth/forms/SignUpForm';
import { type ResetFormValues, type SignInFormValues, type SignUpFormValues } from '~/components/auth/forms/schemas';
import { Button } from '~/components/ui/Button';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Separator } from '~/components/ui/Separator';
import { useAuth } from '~/lib/contexts/AuthContext';
import { classNames } from '~/utils/classNames';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

type OAuthProvider = {
  key: 'github' | 'google';
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

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

  const oauthProviders = useMemo<OAuthProvider[]>(
    () => [
      {
        key: 'github',
        label: 'Continue with GitHub',
        description: 'Sign in using your GitHub account',
        icon: Github,
      },
      {
        key: 'google',
        label: 'Continue with Google',
        description: 'Use your Google account to sign in',
        icon: GoogleIcon,
      },
    ],
    [],
  );

  const modeCopy = useMemo(() => {
    if (mode === 'signup') {
      return {
        heading: 'Create your BoltDIY account',
        subheading: 'Set up your workspace to save prompts, collaborate, and sync projects across devices.',
        badge: 'Join the builders',
        sideTitle: 'Build faster together',
        sideSubtitle:
          'Collaborate with your team, keep conversations versioned, and deploy updates with a single command.',
        bullets: [
          'Save chats with full repo context so you never lose track of decisions.',
          'Generate boilerplate, migrations, and docs in seconds with AI copilots.',
          'Invite teammates to co-edit prompts inside shared BoltDIY workspaces.',
        ],
        tip: 'Pro tip: Use your work email to auto-discover team workspaces.',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in',
        switchTarget: 'signin' as const,
      };
    }

    if (mode === 'reset') {
      return {
        heading: 'Reset your password',
        subheading: 'We’ll email you a secure link so you can create a new password right away.',
        badge: 'Need a hand?',
        sideTitle: 'Recover access securely',
        sideSubtitle: 'We protect your projects with single-use reset links and security notifications.',
        bullets: [
          'Reset links expire after 10 minutes to keep access protected.',
          'Choose a brand new password immediately after opening the email.',
          'Still stuck? Reach out at support@boltdiy.app for direct help.',
        ],
        tip: 'If the email hasn’t arrived within a few minutes, check spam or resend the request.',
        switchPrompt: 'Remembered your password?',
        switchAction: 'Back to sign in',
        switchTarget: 'signin' as const,
      };
    }

    return {
      heading: 'Welcome back',
      subheading: 'Sign in to unlock saved chats, shared workspaces, and synced projects.',
      badge: 'Trusted by builders',
      sideTitle: 'Your progress, everywhere',
      sideSubtitle: 'Resume conversations with context, ship updates faster, and keep teammates aligned in real time.',
      bullets: [
        'Persistent chat history with code-aware memory whenever you return.',
        'Deploy Supabase projects with preconfigured environments in seconds.',
        'Pair program in shared canvases that stay perfectly in sync.',
      ],
      tip: 'Tip: Enable two-factor authentication in Settings for an extra layer of security.',
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
        <div className="relative isolate overflow-hidden rounded-[28px] border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)] dark:shadow-[0_32px_80px_-28px_rgba(0,0,0,0.7)]">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-bolt-elements-button-primary-background blur-3xl" />
            <div className="absolute -bottom-24 left-[-10%] h-56 w-56 rounded-full bg-accent-500/20 blur-[90px]" />
          </div>

          <div className="relative grid gap-0 md:grid-cols-[1.05fr,1fr]">
            <aside className="relative hidden flex-col gap-6 overflow-hidden border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-8 backdrop-blur-sm md:flex">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-500/25 via-transparent to-accent-700/20 dark:from-accent-400/20 dark:to-white/10" />
              <div className="relative z-10 flex flex-col gap-6 text-bolt-elements-textPrimary">
                <span className="inline-flex items-center gap-2 self-start rounded-full border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bolt-elements-textSecondary">
                  <Sparkles className="h-3.5 w-3.5 text-bolt-elements-button-primary-background" />
                  {modeCopy.badge}
                </span>
                <div>
                  <h3 className="text-2xl font-semibold leading-tight">{modeCopy.sideTitle}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-bolt-elements-textSecondary">
                    {modeCopy.sideSubtitle}
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-bolt-elements-textPrimary">
                  {modeCopy.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 px-3 py-2 shadow-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-bolt-elements-button-primary-background" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto rounded-2xl border border-dashed border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 p-4 text-xs leading-relaxed text-bolt-elements-textSecondary">
                  {modeCopy.tip}
                </div>
              </div>
            </aside>

            <main className="flex flex-col gap-6 p-6 md:p-8">
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 py-2 text-sm font-semibold text-bolt-elements-textSecondary transition-all hover:border-bolt-elements-borderColorActive hover:text-bolt-elements-textPrimary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              )}

              <DialogTitle className="flex flex-col gap-3 border-none p-0 text-left text-2xl font-semibold leading-tight text-bolt-elements-textPrimary md:text-[28px]">
                <span>{modeCopy.heading}</span>
                <span className="text-base font-normal text-bolt-elements-textSecondary md:text-lg">
                  {modeCopy.subheading}
                </span>
              </DialogTitle>

              {mode !== 'reset' && (
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-full items-center rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-1 shadow-inner">
                    {(['signin', 'signup'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMode(item)}
                        className={classNames(
                          'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none',
                          {
                            'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text shadow-sm':
                              mode === item,
                            'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary': mode !== item,
                          },
                        )}
                      >
                        {item === 'signin' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-bolt-elements-textTertiary">Switch anytime—your details stay in place.</p>
                </div>
              )}

              {mode !== 'reset' && (
                <>
                  <div className="space-y-3">
                    {oauthProviders.map((provider) => (
                      <Button
                        key={provider.key}
                        variant="outline"
                        size="lg"
                        className={classNames(
                          'group w-full justify-start gap-3 rounded-2xl border px-4 py-3 text-base font-semibold shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background focus-visible:ring-offset-2 focus-visible:ring-offset-bolt-elements-bg-depth-1',
                          provider.key === 'github'
                            ? 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2'
                            : 'border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2',
                        )}
                        onClick={() => handleOAuth(provider.key)}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 text-bolt-elements-textSecondary transition-all group-hover:border-bolt-elements-borderColorActive group-hover:text-bolt-elements-textPrimary">
                          <provider.icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1 text-left">
                          <span>{provider.label}</span>
                          <span className="mt-0.5 block text-xs font-normal text-bolt-elements-textSecondary">
                            {provider.description}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>

                  <div className="relative text-center">
                    <Separator className="bg-bolt-elements-borderColor" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-bolt-elements-bg-depth-1 px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-bolt-elements-textTertiary">
                      or continue with email
                    </span>
                  </div>
                </>
              )}

              {mode === 'signin' && (
                <SignInForm
                  loading={loading}
                  error={error}
                  open={open}
                  onSubmit={handleSignInSubmit}
                  onForgotPassword={() => setMode('reset')}
                  initialValues={signInDefaults}
                  onValuesChange={handleSignInValuesChange}
                />
              )}

              {mode === 'signup' && (
                <SignUpForm
                  loading={loading}
                  error={error}
                  open={open}
                  onSubmit={handleSignUpSubmit}
                  initialValues={signUpDefaults}
                  onValuesChange={handleSignUpValuesChange}
                />
              )}

              {mode === 'reset' && (
                <ResetPasswordForm
                  loading={loading}
                  error={error}
                  success={resetSuccess}
                  open={open}
                  onSubmit={handleResetSubmit}
                  initialValues={resetDefaults}
                  onValuesChange={handleResetValuesChange}
                />
              )}

              <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 py-4 text-sm text-bolt-elements-textSecondary">
                <span>{modeCopy.switchPrompt}</span>
                <button
                  type="button"
                  onClick={() => setMode(modeCopy.switchTarget)}
                  className="font-semibold text-bolt-elements-button-primary-background transition-all hover:text-bolt-elements-button-primary-background/80 hover:underline"
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
