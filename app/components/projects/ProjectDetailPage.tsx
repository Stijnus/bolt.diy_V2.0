import { useNavigate } from '@remix-run/react';
import { ArrowLeft, Calendar, Edit, FolderKanban, Globe, Lock, Loader2, Share2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { EditProjectDialog } from '~/components/projects/EditProjectDialog';
import { ProjectChatList } from '~/components/projects/ProjectChatList';
import { ProjectShareDialog } from '~/components/projects/ProjectShareDialog';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Separator } from '~/components/ui/Separator';
import { projectService, type Project } from '~/lib/services/projects';
import { refreshProjects, selectProject } from '~/lib/stores/project';
import { cn } from '~/lib/utils';

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [collaboratorCount, setCollaboratorCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const metadata = useMemo(() => {
    if (!project) {
      return [];
    }

    return [
      {
        icon: Calendar,
        label: 'Created',
        value: project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown',
      },
      {
        icon: Calendar,
        label: 'Updated',
        value: project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Unknown',
      },
      {
        icon: Users,
        label: 'Collaborators',
        value: collaboratorCount,
      },
      {
        icon: project.visibility === 'public' ? Globe : Lock,
        label: 'Visibility',
        value: project.visibility === 'public' ? 'Public' : 'Private',
      },
    ];
  }, [project, collaboratorCount]);

  const loadProject = async () => {
    setLoading(true);

    try {
      selectProject(projectId);
      await refreshProjects(true);

      const [projectData, collaborators] = await Promise.all([
        projectService.getProject(projectId),
        projectService.getCollaborators(projectId),
      ]);
      setProject(projectData);
      setCollaboratorCount(collaborators.length);
    } catch (error: any) {
      toast.error(`Failed to load project: ${error.message ?? 'Unknown error'}`);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  const handleShareChange = (open: boolean) => {
    setShareOpen(open);

    if (!open) {
      void loadProject();
    }
  };

  const handleEditChange = (open: boolean) => {
    setEditOpen(open);
  };

  const handleEditSuccess = () => {
    void loadProject();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12">
        <div className="flex items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-textSecondary" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">Loading project...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="text-3xl font-semibold text-bolt-elements-textPrimary">Project not found</div>
        <div className="text-sm text-bolt-elements-textSecondary">
          The project you are looking for may have been deleted or you do not have access.
        </div>
        <Button onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </div>
    );
  }

  const visibilityBadge = (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        project.visibility === 'public'
          ? 'bg-bolt-elements-button-success-background/15 text-bolt-elements-button-success-text'
          : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary border border-bolt-elements-borderColor/60',
      )}
    >
      {project.visibility === 'public' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {project.visibility === 'public' ? 'Public project' : 'Private project'}
    </span>
  );

  return (
    <div className="space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-bolt-elements-textSecondary">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </div>

      <Card className="space-y-6 border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bolt-elements-button-primary-background/15">
                <FolderKanban className="h-6 w-6 text-bolt-elements-icon-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary">{project.name}</h1>
                  {visibilityBadge}
                </div>
                {project.description && (
                  <p className="mt-2 text-sm leading-relaxed text-bolt-elements-textSecondary">{project.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setShareOpen(true);
              }}
            >
              <Share2 className="h-4 w-4" />
              Share project
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setEditOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
              Edit project
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metadata.map((item) => (
            <div
              key={item.label}
              className={cn(
                'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200',
                'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
                'hover:border-bolt-elements-borderColorActive hover:shadow-md hover:-translate-y-0.5',
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bolt-elements-button-primary-background group-hover:bg-bolt-elements-button-primary-backgroundHover transition-colors">
                <item.icon className="h-5 w-5 text-bolt-elements-icon-primary" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-bolt-elements-textTertiary">
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-bolt-elements-textPrimary">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Project Chat History */}
      <ProjectChatList />

      <ProjectShareDialog
        project={project}
        open={shareOpen}
        onOpenChange={handleShareChange}
        onCollaboratorsUpdated={() => {
          handleEditSuccess();
        }}
      />
      <EditProjectDialog project={project} open={editOpen} onOpenChange={handleEditChange} onSuccess={handleEditSuccess} />
    </div>
  );
}
