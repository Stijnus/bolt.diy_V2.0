import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { signUpSchema, type SignUpFormValues } from './schemas';

import { Button } from '~/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';
import { classNames } from '~/utils/classNames';

type PasswordStrength = 'weak' | 'medium' | 'strong' | null;

interface SignUpFormProps {
  loading: boolean;
  error: string | null;
  open: boolean;
  onSubmit: (values: SignUpFormValues) => Promise<void> | void;
  initialValues: SignUpFormValues;
  onValuesChange: (values: SignUpFormValues) => void;
}

export function SignUpForm({ loading, error, open, onSubmit, initialValues, onValuesChange }: SignUpFormProps) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: initialValues,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(null);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      onValuesChange(values as SignUpFormValues);

      if (name === 'password') {
        evaluatePasswordStrength((values as SignUpFormValues).password ?? '');
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  useEffect(() => {
    if (!open) {
      form.reset(initialValues);
      setShowPassword(false);
      setPasswordStrength(null);
    }
  }, [open, form, initialValues]);

  const evaluatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;

    if (password.length >= 8) {
      strength++;
    }

    if (/[A-Z]/.test(password)) {
      strength++;
    }

    if (/[0-9]/.test(password)) {
      strength++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength++;
    }

    if (strength <= 1) {
      setPasswordStrength('weak');
    } else if (strength === 2 || strength === 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = useMemo(
    () =>
      form.handleSubmit(async (values) => {
        await onSubmit(values);
      }),
    [form, onSubmit],
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  disabled={loading}
                  className="h-12 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 px-4 text-base shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all placeholder:text-bolt-elements-textTertiary focus-visible:border-bolt-elements-borderColorActive focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background focus-visible:ring-offset-2 focus-visible:ring-offset-bolt-elements-bg-depth-1 dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...field}
                    disabled={loading}
                    className="h-12 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-bg-depth-1 px-4 pr-12 text-base shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all placeholder:text-bolt-elements-textTertiary focus-visible:border-bolt-elements-borderColorActive focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background focus-visible:ring-offset-2 focus-visible:ring-offset-bolt-elements-bg-depth-1 dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-bolt-elements-textTertiary transition-colors hover:text-bolt-elements-textPrimary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />

              {field.value ? (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <span
                      className={classNames('h-1 flex-1 rounded-full transition-all', {
                        'bg-red-500': passwordStrength === 'weak',
                        'bg-orange-400': passwordStrength === 'medium',
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-bolt-elements-borderColor': !passwordStrength,
                      })}
                    />
                    <span
                      className={classNames('h-1 flex-1 rounded-full transition-all', {
                        'bg-orange-400': passwordStrength === 'medium',
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-bolt-elements-borderColor': passwordStrength !== 'medium' && passwordStrength !== 'strong',
                      })}
                    />
                    <span
                      className={classNames('h-1 flex-1 rounded-full transition-all', {
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-bolt-elements-borderColor': passwordStrength !== 'strong',
                      })}
                    />
                  </div>
                  <p
                    className={classNames('text-xs font-medium', {
                      'text-red-500': passwordStrength === 'weak',
                      'text-orange-500': passwordStrength === 'medium',
                      'text-green-600': passwordStrength === 'strong',
                    })}
                  >
                    {passwordStrength === 'weak' && 'Weak password'}
                    {passwordStrength === 'medium' && 'Medium password'}
                    {passwordStrength === 'strong' && 'Strong password'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-bolt-elements-textTertiary">
                  At least 6 characters, one uppercase letter, and one number
                </p>
              )}
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm shadow-sm dark:border-red-400/40 dark:bg-red-500/15">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
              <span className="text-bolt-elements-textPrimary">{error}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl text-base font-semibold shadow-lg transition-all hover:shadow-xl focus-visible:ring-2 focus-visible:ring-bolt-elements-button-primary-background focus-visible:ring-offset-2 focus-visible:ring-offset-bolt-elements-bg-depth-1"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </Form>
  );
}
