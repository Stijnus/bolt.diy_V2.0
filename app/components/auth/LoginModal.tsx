import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Github, ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '~/components/ui/Button';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';
import { Separator } from '~/components/ui/Separator';
import { useAuth } from '~/lib/contexts/AuthContext';

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

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

const resetSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp, signInWithGitHub, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const schema = mode === 'reset' ? resetSchema : mode === 'signup' ? signUpSchema : signInSchema;

  const form = useForm<SignInFormValues | SignUpFormValues | ResetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!open) {
      setMode('signin');
      form.reset();
      setError(null);
      setLoading(false);
      setResetSuccess(false);
    }
  }, [open, form]);

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

  const onSubmit = async (data: SignInFormValues | SignUpFormValues | ResetFormValues) => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'reset') {
        await resetPassword((data as ResetFormValues).email);
        setResetSuccess(true);
      } else if (mode === 'signin') {
        await signIn((data as SignInFormValues).email, (data as SignInFormValues).password);
        onClose();
      } else {
        await signUp((data as SignUpFormValues).email, (data as SignUpFormValues).password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError(null);

    try {
      if (provider === 'github') {
        await signInWithGitHub();
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      setError(err.message ?? 'Unable to sign in with that provider right now.');
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <Dialog className="max-w-md overflow-hidden">
        <DialogTitle className="flex-col items-start gap-2 border-none px-8 pt-8 pb-2">
          <div className="w-full">
            {mode === 'reset' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="mb-4 flex items-center gap-2 text-sm font-medium text-bolt-elements-textSecondary transition-colors hover:text-bolt-elements-textPrimary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <div className="text-2xl font-bold text-bolt-elements-textPrimary">Reset your password</div>
                <p className="mt-2 text-sm text-bolt-elements-textSecondary">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </div>
                  <p className="mt-2 text-sm text-bolt-elements-textSecondary">
                    {mode === 'signin'
                      ? 'Sign in to unlock saved chats, shared workspaces, and synced projects.'
                      : 'Set up your account to save prompts, collaborate, and sync projects across devices.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogTitle>

        <div className="space-y-5 px-8 pb-8">
          {mode !== 'reset' && (
            <>
              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.key}
                    variant="outline"
                    size="lg"
                    className="w-full justify-center gap-3 border-bolt-elements-borderColor bg-transparent font-semibold transition-all hover:bg-bolt-elements-background-depth-2 hover:border-bolt-elements-borderColorActive"
                    onClick={() => handleOAuth(provider.key)}
                  >
                    <provider.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{provider.label}</span>
                  </Button>
                ))}
              </div>

              <div className="relative text-center">
                <Separator className="bg-bolt-elements-borderColor" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-bolt-elements-bg-depth-1 px-4 text-xs font-medium uppercase tracking-wider text-bolt-elements-textTertiary">
                  or continue with email
                </span>
              </div>
            </>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">
                      Email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        disabled={loading}
                        className="h-12 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 text-base transition-all placeholder:text-bolt-elements-textTertiary focus-visible:border-bolt-elements-borderColorActive focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {mode !== 'reset' && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                          {...field}
                          disabled={loading}
                          className="h-12 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 text-base transition-all placeholder:text-bolt-elements-textTertiary focus-visible:border-bolt-elements-borderColorActive focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                      {mode === 'signup' && (
                        <p className="text-xs text-bolt-elements-textTertiary">
                          At least 6 characters, one uppercase letter, and one number
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              {error && (
                <div className="rounded-xl border border-bolt-elements-icon-error/20 bg-bolt-elements-icon-error/10 px-4 py-3.5 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-bolt-elements-icon-error" />
                    <span className="text-bolt-elements-textPrimary">{error}</span>
                  </div>
                </div>
              )}

              {resetSuccess && (
                <div className="rounded-xl border border-bolt-elements-icon-success/20 bg-bolt-elements-icon-success/10 px-4 py-3.5 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-bolt-elements-icon-success" />
                    <span className="text-bolt-elements-textPrimary">
                      Password reset link sent! Check your email inbox.
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'reset' ? 'Sending link…' : mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : mode === 'reset' ? (
                  'Send reset link'
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          {mode === 'signin' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-sm font-semibold text-primary transition-all hover:text-primary/80 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {mode !== 'reset' && (
          <div className="flex items-center justify-center gap-1.5 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/50 px-8 py-5 text-sm">
            <span className="text-bolt-elements-textSecondary">
              {mode === 'signin' ? 'New to Bolt?' : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))}
              className="font-semibold text-primary transition-all hover:text-primary/80 hover:underline"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        )}
      </Dialog>
    </DialogRoot>
  );
}
