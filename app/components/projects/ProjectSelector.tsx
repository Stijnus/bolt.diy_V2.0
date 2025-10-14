import { useStore } from '@nanostores/react';
import { Loader2, FolderKanban, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '~/components/ui/Select';
import { useAuth } from '~/lib/contexts/AuthContext';
import { projectStore, refreshProjects, selectProject, clearProjects, getCurrentProject } from '~/lib/stores/project';

const NO_PROJECT_VALUE = '__none__';

export function ProjectSelector() {
  const { user } = useAuth();
  const state = useStore(projectStore);
  const selectedProject = getCurrentProject();

  useEffect(() => {
    if (!user) {
      clearProjects();
      return;
    }

    void refreshProjects();
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const hasProjects = state.projects.length > 0;
  const selectValue = selectedProject ? selectedProject.id : NO_PROJECT_VALUE;

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={selectValue}
        onValueChange={(value) => {
          if (value === NO_PROJECT_VALUE) {
            selectProject(null);
          } else {
            selectProject(value);
          }
        }}
        disabled={state.loading || !hasProjects}
      >
        <SelectTrigger className="h-9 min-w-[220px] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 text-sm text-bolt-elements-textPrimary focus:ring-bolt-elements-borderColorActive">
          <div className="flex items-center gap-2">
            {state.loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-bolt-elements-textSecondary" />
            ) : (
              <FolderKanban className="h-4 w-4 text-bolt-elements-icon-primary" />
            )}
            <SelectValue
              placeholder={state.loading ? 'Loading projects...' : hasProjects ? 'Select a project' : 'No projects'}
            />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value={NO_PROJECT_VALUE}>No project</SelectItem>
          {state.projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {state.error ? (
        <div className="flex items-center gap-1 text-xs text-bolt-elements-textError">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{state.error}</span>
        </div>
      ) : null}
    </div>
  );
}
