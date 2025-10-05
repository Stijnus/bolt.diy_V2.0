import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Dialog, DialogRoot, DialogTitle, DialogDescription, DialogButton } from '~/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Textarea } from '~/components/ui/Textarea';
import { projectService } from '~/lib/services/projects';
import type { Database } from '~/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  visibility: z.enum(['private', 'public']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }: EditProjectDialogProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    values: project
      ? {
          name: project.name,
          description: project.description || '',
          visibility: project.visibility as 'private' | 'public',
        }
      : {
          name: '',
          description: '',
          visibility: 'private',
        },
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) {
      return;
    }

    try {
      await projectService.updateProject(project.id, {
        name: data.name,
        description: data.description || null,
        visibility: data.visibility,
      });

      toast.success('Project updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to update project: ${error.message}`);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog className="w-[95vw] max-w-[500px]">
        <DialogTitle>
          <span>Edit Project</span>
        </DialogTitle>

        <DialogDescription>Make changes to your project. Click save when you're done.</DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 pb-5 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of your project..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-bolt-elements-borderColor">
              <DialogButton type="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </DialogButton>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="inline-flex h-[35px] items-center justify-center rounded-lg px-4 text-sm leading-none focus:outline-none bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Form>
      </Dialog>
    </DialogRoot>
  );
}
