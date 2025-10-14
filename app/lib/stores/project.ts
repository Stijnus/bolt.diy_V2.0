import { map } from 'nanostores';

import { projectService, type Project } from '~/lib/services/projects';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  updatedAt: string | null;
  collaboratorCount: number;
}

interface ProjectState {
  projects: ProjectSummary[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
}

const STORAGE_KEY = 'bolt.currentProjectId';
const logger = createScopedLogger('ProjectStore');

const initialState: ProjectState = {
  projects: [],
  currentProjectId: null,
  loading: false,
  error: null,
  lastLoadedAt: null,
};

if (typeof window !== 'undefined') {
  try {
    const storedId = window.localStorage.getItem(STORAGE_KEY);

    if (storedId) {
      initialState.currentProjectId = storedId;
    }
  } catch (error) {
    logger.warn('Failed to read project selection from storage', error as Error);
  }
}

export const projectStore = map<ProjectState>(initialState);

let loadPromise: Promise<void> | null = null;

export function getCurrentProject(): ProjectSummary | undefined {
  const state = projectStore.get();
  return state.projects.find((project) => project.id === state.currentProjectId);
}

export function selectProject(projectId: string | null) {
  const state = projectStore.get();
  const nextId = projectId && state.projects.some((project) => project.id === projectId) ? projectId : null;

  projectStore.set({
    ...state,
    currentProjectId: nextId,
  });

  persistCurrentProject(nextId);
}

export async function refreshProjects(force = false) {
  const CACHE_TTL = 30_000;
  const state = projectStore.get();

  if (!force) {
    if (loadPromise) {
      return loadPromise;
    }

    if (state.lastLoadedAt && Date.now() - state.lastLoadedAt < CACHE_TTL) {
      return Promise.resolve();
    }
  }

  if (force && loadPromise) {
    try {
      await loadPromise;
    } catch (_error) {
      // ignore previous failure, we'll retry below
    }
  }

  if (loadPromise && !force) {
    return loadPromise;
  }

  loadPromise = (async () => {
    projectStore.setKey('loading', true);
    projectStore.setKey('error', null);

    try {
      const projects = await projectService.getProjects();
      applyProjectList(projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      logger.error('Failed to load projects', error as Error);
      projectStore.set({
        ...projectStore.get(),
        loading: false,
        error: message,
      });
    }
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export function applyProjectList(projects: Project[]) {
  const summaries = projects.map(normalizeProject);
  const state = projectStore.get();

  const hasExistingSelection =
    state.currentProjectId && summaries.some((project) => project.id === state.currentProjectId);

  const nextId = summaries.length === 0 ? null : hasExistingSelection ? state.currentProjectId : summaries[0].id;

  projectStore.set({
    projects: summaries,
    currentProjectId: nextId,
    loading: false,
    error: null,
    lastLoadedAt: Date.now(),
  });

  persistCurrentProject(nextId);
}

export function clearProjects() {
  projectStore.set({
    projects: [],
    currentProjectId: null,
    loading: false,
    error: null,
    lastLoadedAt: Date.now(),
  });

  persistCurrentProject(null);
}

function persistCurrentProject(projectId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (projectId) {
      window.localStorage.setItem(STORAGE_KEY, projectId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    logger.warn('Failed to persist project selection', error as Error);
  }
}

function normalizeProject(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    visibility: project.visibility,
    updatedAt: project.updated_at ?? null,
    collaboratorCount: project.collaborator_count ?? 0,
  };
}

projectStore.listen((state) => {
  workbenchStore.setProjectContext(state.currentProjectId);
});
