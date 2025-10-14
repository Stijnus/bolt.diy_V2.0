import { useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Edit,
  Filter,
  FolderKanban,
  Globe,
  Loader2,
  Lock,
  MoreVertical,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
import { projectService } from '~/lib/services/projects';
import { refreshProjects, selectProject } from '~/lib/stores/project';
import type { Database } from '~/lib/supabase/types';
import { cn } from '~/lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];
type VisibilityFilter = 'all' | 'public' | 'private';

const FILTERS: { label: string; value: VisibilityFilter }[] = [
  { label: 'All projects', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

interface ProjectsListProps {
  refreshTrigger?: number;
}

export function ProjectsList({ refreshTrigger }: ProjectsListProps = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string } | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    void loadProjects();
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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getTimeAgo = (date: string | null | undefined) => {
    if (!date) {
      return 'Unknown';
    }

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

  const handleOpenProject = async (project: Project) => {
    if (!project) {
      return;
    }

    try {
      selectProject(project.id);

      const loadingToast = toast.loading(`Opening project "${project.name}"...`);

      try {
        const latestChatId = await projectService.getProjectLatestChatId(project.id);

        if (latestChatId) {
          toast.update(loadingToast, {
            render: 'Loading project workspace...',
            type: 'success',
            isLoading: false,
            autoClose: 1500,
          });
          navigate(`/chat/${latestChatId}`);
        } else {
          toast.update(loadingToast, {
            render: `Starting new session for "${project.name}"...`,
            type: 'success',
            isLoading: false,
            autoClose: 1500,
          });
          navigate(`/?projectId=${project.id}`);
        }

        refreshProjects(true).catch((err) => {
          console.warn('Background refresh failed', err);
        });
      } catch (error: any) {
        toast.update(loadingToast, {
          render: `Failed to open project: ${error?.message ?? 'Unknown error'}`,
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      toast.error(`Failed to open project: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleFilterChange = (filter: VisibilityFilter) => {
    setVisibilityFilter(filter);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesFilter = visibilityFilter === 'all' ? true : project.visibility === visibilityFilter;
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase().trim());

      return matchesFilter && matchesSearch;
    });
  }, [projects, visibilityFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = projects.length;
    const publicCount = projects.filter((project) => project.visibility === 'public').length;
    const privateCount = total - publicCount;

    return [
      { label: 'Total projects', value: total, icon: FolderKanban },
      { label: 'Public', value: publicCount, icon: Globe },
      { label: 'Private', value: privateCount, icon: Lock },
    ];
  }, [projects]);

  const renderEmptyState = () => (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-br from-bolt-elements-button-primary-background to-transparent opacity-25 blur-3xl" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-bolt-elements-button-primary-background to-transparent opacity-10" />
            <FolderKanban className="relative h-16 w-16 text-bolt-elements-icon-primary" />
          </div>
          <div className="absolute -right-3 -top-3">
            <Sparkles className="h-7 w-7 text-bolt-elements-icon-primary animate-pulse" />
          </div>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-bolt-elements-textPrimary">No projects match your filters</h3>
        <p className="mb-6 max-w-md text-sm text-bolt-elements-textSecondary">
          Try adjusting your filters or create a new project to get started with a fresh workspace.
        </p>
      </motion.div>
    </div>
  );

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
    return renderEmptyState();
  }

  return (
    <>
      <div className="flex flex-col gap-8 p-6">
        <section className="relative overflow-hidden rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-6 py-8 shadow-sm">
          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-bolt-elements-button-primary-background blur-3xl" />
            <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-bolt-elements-button-primary-backgroundHover blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-bolt-elements-borderColor/70 bg-bolt-elements-background-depth-1 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-bolt-elements-textSecondary">
                  <Sparkles className="h-3 w-3 text-bolt-elements-icon-primary" />
                  Projects
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary md:text-3xl">
                    Your workspace hub
                  </h1>
                  <p className="max-w-2xl text-sm text-bolt-elements-textSecondary md:text-base">
                    Browse, organize, and jump into projects instantly. Filter by visibility, search by name, and
                    monitor recent activity at a glance.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bolt-elements-textTertiary" />
                  <input
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search projects"
                    className="w-full rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 py-2 pl-10 pr-4 text-sm text-bolt-elements-textPrimary outline-none transition-colors focus:border-bolt-elements-borderColorActive focus:ring-2 focus:ring-bolt-elements-borderColorActive/40"
                  />
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bolt-elements-textSecondary">
                  <Filter className="h-4 w-4" />
                  Filters
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleFilterChange(filter.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all',
                    visibilityFilter === filter.value
                      ? 'border-bolt-elements-borderColorActive bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                      : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:border-bolt-elements-borderColorActive',
                  )}
                >
                  {visibilityFilter === filter.value && <Star className="h-3 w-3" />}
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
                    'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
                    'hover:border-bolt-elements-borderColorActive hover:shadow-md',
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bolt-elements-button-primary-background group-hover:bg-bolt-elements-button-primary-backgroundHover transition-colors">
                    <stat.icon className="h-5 w-5 text-bolt-elements-icon-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-bolt-elements-textTertiary">
                      {stat.label}
                    </div>
                    <div className="text-lg font-semibold text-bolt-elements-textPrimary">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {filteredProjects.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project, index) => (
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
                    'relative flex h-full flex-col overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6 transition-all duration-300',
                    'hover:border-bolt-elements-borderColorActive hover:shadow-xl hover:-translate-y-1.5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bolt-elements-button-primary-background">
                          <FolderKanban className="h-5 w-5 text-bolt-elements-icon-primary" />
                        </div>
                        <Badge
                          className={cn(
                            'gap-2 border px-2.5 py-1 text-xs font-semibold',
                            project.visibility === 'public'
                              ? 'border-bolt-elements-borderColorActive bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                              : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary',
                          )}
                        >
                          {project.visibility === 'public' ? 'Public project' : 'Private project'}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h3 className="truncate text-lg font-semibold text-bolt-elements-textPrimary group-hover:text-bolt-elements-icon-primary transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="line-clamp-2 text-sm leading-relaxed text-bolt-elements-textSecondary">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

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
                        <DropdownMenuItem onClick={() => handleOpenProject(project)}>
                          <FolderKanban className="mr-2 h-4 w-4" />
                          Open project
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

                  <div className="mt-6 space-y-2">
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

                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 gap-2" size="sm" onClick={() => handleOpenProject(project)}>
                      <FolderKanban className="h-4 w-4" />
                      Open project
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditProject(project)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <EditProjectDialog
        project={editProject}
        open={editProject !== null}
        onOpenChange={(open) => !open && setEditProject(null)}
        onSuccess={loadProjects}
      />

      {deleteProject && (
        <AlertDialog open onOpenChange={(open) => !open && setDeleteProject(null)}>
          <AlertDialogContent>
            <AlertDialogTitle className="px-6 pt-6 text-lg font-semibold text-bolt-elements-textPrimary">
              Delete Project?
            </AlertDialogTitle>
            <AlertDialogDescription className="px-6 pb-4 text-sm text-bolt-elements-textSecondary">
              You are about to permanently delete{' '}
              <strong className="text-bolt-elements-textPrimary">{deleteProject?.name}</strong>. This action cannot be
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
