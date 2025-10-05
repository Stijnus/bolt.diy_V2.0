import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Loader2, Lock, Sparkles } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import * as z from 'zod';

import { Button } from '~/components/ui/Button';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';
import { Separator } from '~/components/ui/Separator';
import { Textarea } from '~/components/ui/Textarea';
import { projectService } from '~/lib/services/projects';
import { classNames } from '~/utils/classNames';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const projectSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Project name is required' })
    .max(100, { message: 'Project name must be 100 characters or less' }),
  description: z.string().max(500, { message: 'Description must be 500 characters or less' }).optional(),
  visibility: z.enum(['private', 'public']),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function CreateProjectDialog({ open, onClose, onCreated }: CreateProjectDialogProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
    },
  });

  const visibilityOptions = useMemo(
    () => [
      {
        value: 'private' as const,
        label: 'Private',
        helper: 'Only invited collaborators can access.',
        icon: Lock,
      },
      {
        value: 'public' as const,
        label: 'Public',
        helper: 'Share a link for anyone to explore.',
        icon: Globe,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      await projectService.createProject({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        visibility: data.visibility,
      });

      toast.success('Project created successfully');
      form.reset();
      onClose();
      onCreated?.();
    } catch (error: any) {
      toast.error(`Failed to create project: ${error.message}`);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <Dialog className="max-w-2xl">
        <DialogTitle className="flex-col items-start gap-4">
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold text-bolt-elements-textPrimary">Create new project</div>
              <div className="flex items-center gap-2 rounded-full border border-bolt-elements-borderColor/60 bg-bolt-elements-background-depth-1 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-bolt-elements-textTertiary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Setup
              </div>
            </div>
            <p className="text-sm font-normal text-bolt-elements-textSecondary">
              Create a workspace for your next idea. You can change these settings anytime.
            </p>
          </div>
        </DialogTitle>

        <div className="px-5 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">Project name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My awesome project"
                        {...field}
                        autoFocus
                        disabled={form.formState.isSubmitting}
                        className="transition-all focus-visible:ring-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">
                      Description{' '}
                      <span className="text-xs font-normal text-bolt-elements-textTertiary">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Give collaborators a quick overview of what this project is about..."
                        rows={3}
                        {...field}
                        disabled={form.formState.isSubmitting}
                        className="min-h-[100px] transition-all focus-visible:ring-2"
                      />
                    </FormControl>
                    <FormDescription>{field.value?.length || 0}/500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Visibility */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-bolt-elements-textPrimary">Visibility</FormLabel>
                    <FormDescription className="mb-3">
                      Control who can find and collaborate on this project.
                    </FormDescription>
                    <FormControl>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {visibilityOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = field.value === option.value;

                          return (
                            <label
                              key={option.value}
                              className={classNames(
                                'group relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-all',
                                {
                                  'border-bolt-elements-borderColorActive bg-bolt-elements-button-primary-background/5':
                                    isActive,
                                  'border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-2/80 hover:border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1/90':
                                    !isActive,
                                },
                              )}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                value={option.value}
                                checked={isActive}
                                onChange={() => field.onChange(option.value)}
                                disabled={form.formState.isSubmitting}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={classNames(
                                      'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                      {
                                        'bg-bolt-elements-button-primary-background/10 text-bolt-elements-button-primary-text':
                                          isActive,
                                        'bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary':
                                          !isActive,
                                      },
                                    )}
                                  >
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <span className="text-sm font-semibold text-bolt-elements-textPrimary">
                                    {option.label}
                                  </span>
                                </div>
                                <span
                                  className={classNames('h-4 w-4 rounded-full border-2 transition-all', {
                                    'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background':
                                      isActive,
                                    'border-bolt-elements-borderColor': !isActive,
                                  })}
                                  aria-hidden
                                >
                                  {isActive && (
                                    <span className="flex h-full w-full items-center justify-center">
                                      <span className="h-2 w-2 rounded-full bg-bolt-elements-button-primary-text"></span>
                                    </span>
                                  )}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-bolt-elements-textSecondary">
                                {option.helper}
                              </p>
                            </label>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex flex-col gap-2 border-t border-bolt-elements-borderColor pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={form.formState.isSubmitting}
                  className="sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="sm:w-auto">
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating project...
                    </>
                  ) : (
                    'Create project'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
