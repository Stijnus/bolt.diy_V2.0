import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { resetSchema, type ResetFormValues } from './schemas';

import { Button } from '~/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';

interface ResetPasswordFormProps {
  loading: boolean;
  error: string | null;
  success: boolean;
  open: boolean;
  onSubmit: (values: ResetFormValues) => Promise<void> | void;
  initialValues: ResetFormValues;
  onValuesChange: (values: ResetFormValues) => void;
}

export function ResetPasswordForm({
  loading,
  error,
  success,
  open,
  onSubmit,
  initialValues,
  onValuesChange,
}: ResetPasswordFormProps) {
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      onValuesChange(values as ResetFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  useEffect(() => {
    if (!open) {
      form.reset(initialValues);
    }
  }, [open, form, initialValues]);

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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium">Reset link sent!</p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Check your email inbox for the password reset link.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" size="lg" disabled={loading || success} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending link…
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>
    </Form>
  );
}
