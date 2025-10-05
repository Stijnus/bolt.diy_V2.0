import { motion } from 'framer-motion';
import { Calendar, FolderKanban, Globe, Lock, Loader2, Share2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { projectService } from '~/lib/services/projects';
import type { Database } from '~/lib/supabase/types';
import { cn } from '~/lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-icon-primary" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">Loading your projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-bolt-elements-button-primary-background/10 blur-2xl"></div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 shadow-lg">
            <FolderKanban className="h-12 w-12 text-bolt-elements-icon-primary" />
          </div>
        </div>
        <h3 className="mt-8 text-xl font-semibold text-bolt-elements-textPrimary">No projects yet</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-bolt-elements-textSecondary">
          Create your first project to start building with AI. Organize your work, collaborate with teammates, and bring
          your ideas to life.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative"
          >
            <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-bolt-elements-borderColorActive hover:shadow-lg">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-semibold text-bolt-elements-textPrimary">{project.name}</h3>
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-bolt-elements-textSecondary">
                      {project.description}
                    </p>
                  )}
                </div>
                <Badge variant={project.visibility === 'public' ? 'success' : 'default'}>
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

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-bolt-elements-textTertiary">
                <div className="flex items-center gap-1.5 rounded-full bg-bolt-elements-background-depth-2 px-2.5 py-1">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {new Date(project.updated_at || '').toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex flex-col gap-2 border-t border-bolt-elements-borderColor pt-4 sm:flex-row">
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.info('Open project functionality coming soon');
                  }}
                  size="sm"
                >
                  <FolderKanban className="h-4 w-4" />
                  Open
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    toast.info('Share functionality coming soon');
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="sm:w-auto"
                  size="sm"
                  onClick={() => setDeleteProject({ id: project.id, name: project.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteProject !== null} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete <strong>{deleteProject?.name}</strong>. This action cannot be undone
              and all project data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProject(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(
                'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover',
              )}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
