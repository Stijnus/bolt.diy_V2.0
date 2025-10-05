import { motion } from 'framer-motion';
import {
  Calendar,
  FolderKanban,
  Globe,
  Lock,
  Loader2,
  Share2,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { EditProjectDialog } from './EditProjectDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { Separator } from '~/components/ui/Separator';
import { projectService } from '~/lib/services/projects';
import type { Database } from '~/lib/supabase/types';
import { cn } from '~/lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsListProps {
  refreshTrigger?: number;
}

export function ProjectsList({ refreshTrigger }: ProjectsListProps = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string } | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [refreshTrigger]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error: any) {
      toast.error(`Failed to load projects: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) {
      return;
    }

    try {
      await projectService.deleteProject(deleteProject.id);
      toast.success('Project deleted successfully');
      setDeleteProject(null);
      await loadProjects();
    } catch (error: any) {
      toast.error(`Failed to delete project: ${error.message}`);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    }

    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }

    if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-bolt-elements-icon-primary opacity-20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-bolt-elements-button-primary-background">
              <Loader2 className="h-8 w-8 animate-spin text-bolt-elements-icon-primary" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium text-bolt-elements-textPrimary">Loading your projects</span>
            <span className="text-sm text-bolt-elements-textSecondary">Please wait...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            {/* Gradient glow effect */}
            <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-br from-bolt-elements-button-primary-background to-transparent opacity-20 blur-3xl" />

            {/* Icon container */}
            <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 shadow-lg">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-bolt-elements-button-primary-background to-transparent opacity-10" />
              <FolderKanban className="relative h-16 w-16 text-bolt-elements-icon-primary" />
            </div>

            {/* Sparkle decoration */}
            <div className="absolute -right-2 -top-2">
              <Sparkles className="h-6 w-6 text-bolt-elements-icon-primary animate-pulse" />
            </div>
          </div>

          <h3 className="mb-3 text-2xl font-bold text-bolt-elements-textPrimary">No projects yet</h3>
          <p className="mb-6 max-w-md text-base leading-relaxed text-bolt-elements-textSecondary">
            Create your first project to start building with AI. Organize your work, collaborate with teammates, and
            bring your ideas to life.
          </p>

          <div className="flex flex-col items-center gap-3 text-sm text-bolt-elements-textTertiary">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-bolt-elements-icon-primary" />
              <span>AI-powered development</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-bolt-elements-icon-primary" />
              <span>Real-time collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-bolt-elements-icon-primary" />
              <span>Version control built-in</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group"
          >
            <Card
              className={cn(
                'relative h-full overflow-hidden border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-0 transition-all duration-300',
                'hover:border-bolt-elements-borderColorActive hover:shadow-lg hover:-translate-y-1',
                'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-bolt-elements-button-primary-background before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
              )}
            >
              {/* Card Content */}
              <div className="relative z-10 flex h-full flex-col p-6">
                {/* Header with Badge and Menu */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bolt-elements-button-primary-background">
                        <FolderKanban className="h-5 w-5 text-bolt-elements-icon-primary" />
                      </div>
                      <Badge variant={project.visibility === 'public' ? 'success' : 'default'} className="gap-1">
                        {project.visibility === 'public' ? (
                          <>
                            <Globe className="h-3 w-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>
                    <h3 className="mb-2 truncate text-lg font-semibold text-bolt-elements-textPrimary group-hover:text-bolt-elements-icon-primary transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-bolt-elements-textSecondary">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => toast.info('Open project functionality coming soon')}>
                        <FolderKanban className="mr-2 h-4 w-4" />
                        Open Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditProject(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Share functionality coming soon')}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteProject({ id: project.id, name: project.name })}
                        className="text-bolt-elements-button-danger-text focus:text-bolt-elements-button-danger-text"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Metadata */}
                <Separator className="my-4" />
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Updated{' '}
                      {project.updated_at
                        ? getTimeAgo(project.updated_at)
                        : project.created_at
                          ? getTimeAgo(project.created_at)
                          : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created {project.created_at ? formatDate(project.created_at) : 'Unknown'}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    size="sm"
                    onClick={() => toast.info('Open project functionality coming soon')}
                  >
                    <FolderKanban className="h-4 w-4" />
                    Open
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditProject(project)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        project={editProject}
        open={editProject !== null}
        onOpenChange={(open) => !open && setEditProject(null)}
        onSuccess={loadProjects}
      />

      {/* Delete Confirmation Dialog */}
      {deleteProject && (
        <AlertDialog open onOpenChange={(open) => !open && setDeleteProject(null)}>
          <AlertDialogContent>
            <AlertDialogTitle className="px-6 pt-6 text-lg font-semibold text-bolt-elements-textPrimary">
              Delete Project?
            </AlertDialogTitle>
            <AlertDialogDescription className="px-6 pb-4 text-sm text-bolt-elements-textSecondary">
              You are about to permanently delete{' '}
              <strong className="text-bolt-elements-textPrimary">{deleteProject.name}</strong>. This action cannot be
              undone and all project data will be lost.
            </AlertDialogDescription>
            <div className="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
              <AlertDialogCancel onClick={() => setDeleteProject(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className={cn(
                  'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover',
                )}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
