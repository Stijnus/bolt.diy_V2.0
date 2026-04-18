import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
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

        {error && (
          <div className="rounded-2xl border border-bolt-elements-button-danger-text/25 bg-bolt-elements-button-danger-background px-4 py-3 text-sm shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-bolt-elements-button-danger-text" />
              <span className="text-bolt-elements-textPrimary">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-bolt-elements-icon-success/30 bg-bolt-elements-icon-success/10 px-4 py-3 text-sm shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-bolt-elements-icon-success" />
              <span className="text-bolt-elements-textPrimary">Password reset link sent! Check your email inbox.</span>
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
