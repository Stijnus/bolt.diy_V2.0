import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={loading} />
              </FormControl>
              <FormMessage className="text-sm text-red-600 dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...field}
                    disabled={loading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-sm text-red-600 dark:text-red-400" />

              {field.value ? (
                <div className="space-y-3">
                  <div className="flex gap-1.5">
                    <span
                      className={classNames('h-2 flex-1 rounded-full transition-all duration-300', {
                        'bg-red-500': passwordStrength === 'weak',
                        'bg-orange-500': passwordStrength === 'medium',
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-gray-200 dark:bg-gray-700': !passwordStrength,
                      })}
                    />
                    <span
                      className={classNames('h-2 flex-1 rounded-full transition-all duration-300', {
                        'bg-orange-500': passwordStrength === 'medium',
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-gray-200 dark:bg-gray-700': passwordStrength !== 'medium' && passwordStrength !== 'strong',
                      })}
                    />
                    <span
                      className={classNames('h-2 flex-1 rounded-full transition-all duration-300', {
                        'bg-green-500': passwordStrength === 'strong',
                        'bg-gray-200 dark:bg-gray-700': passwordStrength !== 'strong',
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={classNames('text-sm font-medium', {
                        'text-red-600 dark:text-red-400': passwordStrength === 'weak',
                        'text-orange-600 dark:text-orange-400': passwordStrength === 'medium',
                        'text-green-600 dark:text-green-400': passwordStrength === 'strong',
                      })}
                    >
                      {passwordStrength === 'weak' && 'Weak password'}
                      {passwordStrength === 'medium' && 'Medium strength'}
                      {passwordStrength === 'strong' && 'Strong password'}
                    </p>
                    {passwordStrength === 'strong' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use 6+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>
              )}
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
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
