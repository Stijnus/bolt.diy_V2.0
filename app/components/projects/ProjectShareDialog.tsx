import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '~/components/ui/Button';
import { Dialog, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Separator } from '~/components/ui/Separator';
import { projectService, type Collaborator, type Project } from '~/lib/services/projects';
import { cn } from '~/lib/utils';

interface ProjectShareDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollaboratorsUpdated?: () => void;
}

export function ProjectShareDialog({ project, open, onOpenChange, onCollaboratorsUpdated }: ProjectShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [manageLoadingId, setManageLoadingId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');

  const roleOptions = useMemo(
    () => [
      { value: 'editor' as const, label: 'Editor' },
      { value: 'viewer' as const, label: 'Viewer' },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      setCollaborators([]);
      setEmail('');
      setRole('viewer');

      return;
    }

    if (project) {
      void loadCollaborators(project.id);
    }
  }, [open, project?.id]);

  const loadCollaborators = async (projectId: string) => {
    setLoading(true);

    try {
      const list = await projectService.getCollaborators(projectId);
      setCollaborators(list);
    } catch (error: any) {
      toast.error(`Failed to load collaborators: ${error.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!project) {
      return;
    }

    const trimmed = email.trim();

    if (!trimmed) {
      toast.error('Enter an email address to invite.');
      return;
    }

    setInviteLoading(true);

    try {
      await projectService.shareProject(project.id, trimmed, role);
      toast.success('Collaborator invited');
      setEmail('');
      await loadCollaborators(project.id);
      onCollaboratorsUpdated?.();
    } catch (error: any) {
      toast.error(`Failed to invite collaborator: ${error.message ?? 'Unknown error'}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (collaborator: Collaborator) => {
    if (!project) {
      return;
    }

    setManageLoadingId(collaborator.id);

    try {
      await projectService.removeCollaborator(project.id, collaborator.user_id);
      toast.success('Collaborator removed');
      await loadCollaborators(project.id);
      onCollaboratorsUpdated?.();
    } catch (error: any) {
      toast.error(`Failed to remove collaborator: ${error.message ?? 'Unknown error'}`);
    } finally {
      setManageLoadingId(null);
    }
  };

  const handleRoleChange = async (collaborator: Collaborator, nextRole: 'editor' | 'viewer') => {
    if (!project) {
      return;
    }

    if (collaborator.role === nextRole) {
      return;
    }

    setManageLoadingId(collaborator.id);

    try {
      await projectService.updateCollaboratorRole(project.id, collaborator.user_id, nextRole);
      toast.success('Collaborator role updated');
      await loadCollaborators(project.id);
      onCollaboratorsUpdated?.();
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message ?? 'Unknown error'}`);
    } finally {
      setManageLoadingId(null);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog className="max-w-lg">
        <DialogTitle className="text-lg font-semibold text-bolt-elements-textPrimary">
          Share project{project ? ` • ${project.name}` : ''}
        </DialogTitle>
        <DialogDescription className="px-5 py-4 text-sm text-bolt-elements-textSecondary">
          Invite teammates and manage their access.
        </DialogDescription>
        <div className="px-5 pb-5">
          {project ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                    disabled={inviteLoading}
                    className="sm:flex-1"
                  />
                  <Select
                    value={role}
                    onValueChange={(value: 'editor' | 'viewer') => setRole(value)}
                    disabled={inviteLoading}
                  >
                    <SelectTrigger className="sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviteLoading} className="w-full sm:w-auto">
                  {inviteLoading ? 'Sending invite...' : 'Invite collaborator'}
                </Button>
              </div>
              <Separator />
              {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-bolt-elements-textSecondary">
                  Loading collaborators...
                </div>
              ) : collaborators.length === 0 ? (
                <div className="rounded-lg border border-dashed border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-2/60 px-4 py-6 text-center text-sm text-bolt-elements-textSecondary">
                  No collaborators yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex flex-col gap-3 rounded-xl border border-bolt-elements-borderColor/80 bg-bolt-elements-background-depth-2/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                          {collaborator.email ?? collaborator.user_id}
                        </div>
                        <div className="text-xs text-bolt-elements-textSecondary">
                          Added{' '}
                          {collaborator.created_at
                            ? new Date(collaborator.created_at).toLocaleDateString()
                            : 'recently'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                          value={collaborator.role}
                          onValueChange={(value: 'editor' | 'viewer') => handleRoleChange(collaborator, value)}
                          disabled={manageLoadingId === collaborator.id}
                        >
                          <SelectTrigger
                            className={cn('sm:w-32', manageLoadingId === collaborator.id ? 'opacity-70' : '')}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={() => handleRemove(collaborator)}
                          disabled={manageLoadingId === collaborator.id}
                        >
                          {manageLoadingId === collaborator.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-bolt-elements-textSecondary">
              Select a project to manage collaborators.
            </div>
          )}
        </div>
      </Dialog>
    </DialogRoot>
  );
}
