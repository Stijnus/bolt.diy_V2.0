import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '~/components/ui/Button';
import { Dialog, DialogRoot, DialogTitle, DialogDescription, DialogButton } from '~/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/Form';
import { Input } from '~/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Textarea } from '~/components/ui/Textarea';
import { projectService, type Project, type Collaborator } from '~/lib/services/projects';

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

        {project && (
          <div className="px-5 pb-5">
            <CollaboratorsManager project={project} open={open} />
          </div>
        )}
      </Dialog>
    </DialogRoot>
  );
}

function CollaboratorsManager({ project, open }: { project: Project; open: boolean }) {
  const projectId = project.id;
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [roleUpdates, setRoleUpdates] = useState<Record<string, boolean>>({});
  const [removals, setRemovals] = useState<Record<string, boolean>>({});

  const loadCollaborators = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await projectService.getCollaborators(projectId);
      setCollaborators(data);
    } catch (error: any) {
      setError(error?.message || 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) {
      setCollaborators([]);
      setError(null);
      setInviteEmail('');

      return;
    }

    void loadCollaborators();
  }, [open, loadCollaborators]);

  const handleInvite = async () => {
    if (!projectId) {
      return;
    }

    const email = inviteEmail.trim();

    if (!email) {
      toast.error('Enter an email address to invite');
      return;
    }

    setInviteSubmitting(true);

    try {
      await projectService.shareProject(projectId, email, inviteRole);
      toast.success('Invitation sent');
      setInviteEmail('');
      await loadCollaborators();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to invite collaborator');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'editor' | 'viewer') => {
    if (!projectId) {
      return;
    }

    setRoleUpdates((prev) => ({ ...prev, [userId]: true }));

    try {
      await projectService.updateCollaboratorRole(projectId, userId, role);
      setCollaborators((prev) =>
        prev.map((collaborator) => (collaborator.user_id === userId ? { ...collaborator, role } : collaborator)),
      );
      toast.success('Collaborator role updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update role');
    } finally {
      setRoleUpdates((prev) => {
        const next = { ...prev };
        delete next[userId];

        return next;
      });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) {
      return;
    }

    setRemovals((prev) => ({ ...prev, [userId]: true }));

    try {
      await projectService.removeCollaborator(projectId, userId);
      setCollaborators((prev) => prev.filter((collaborator) => collaborator.user_id !== userId));
      toast.success('Collaborator removed');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove collaborator');
    } finally {
      setRemovals((prev) => {
        const next = { ...prev };
        delete next[userId];

        return next;
      });
    }
  };

  const inviteDisabled = inviteSubmitting || loading;

  return (
    <div className="space-y-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/70 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-bolt-elements-textPrimary">Collaborators</span>
        <span className="text-xs text-bolt-elements-textSecondary">
          Invite teammates and manage their access to this project.
        </span>
        <span className="text-xs text-bolt-elements-textTertiary">Project owner ID: {project.user_id}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder=" teammate@example.com"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          disabled={inviteDisabled}
          className="sm:flex-1"
        />
        <Select
          value={inviteRole}
          onValueChange={(value) => setInviteRole(value as 'editor' | 'viewer')}
          disabled={inviteDisabled}
        >
          <SelectTrigger className="sm:w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleInvite} disabled={inviteDisabled} className="sm:w-auto">
          {inviteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Invite
        </Button>
      </div>

      {error && <span className="text-xs text-bolt-elements-textError">{error}</span>}

      <div className="rounded-md border border-dashed border-bolt-elements-borderColor">
        {loading ? (
          <div className="flex items-center gap-2 p-4 text-sm text-bolt-elements-textSecondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading collaborators...
          </div>
        ) : collaborators.length === 0 ? (
          <div className="p-4 text-sm text-bolt-elements-textSecondary">
            No collaborators yet. Invite someone above.
          </div>
        ) : (
          <ul className="divide-y divide-bolt-elements-borderColor/60">
            {collaborators.map((collaborator) => {
              const updatingRole = roleUpdates[collaborator.user_id];
              const removing = removals[collaborator.user_id];
              const disabled = updatingRole || removing;

              return (
                <li
                  key={collaborator.user_id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-bolt-elements-textPrimary">
                      {collaborator.email ?? 'Unknown user'}
                    </span>
                    <span className="text-xs text-bolt-elements-textSecondary">{collaborator.user_id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={collaborator.role}
                      onValueChange={(value) => {
                        if (value !== collaborator.role) {
                          void handleRoleChange(collaborator.user_id, value as 'editor' | 'viewer');
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRemove(collaborator.user_id)}
                      disabled={disabled}
                    >
                      {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Remove'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
