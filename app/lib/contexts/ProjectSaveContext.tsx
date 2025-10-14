import { createContext, useContext, type ReactNode } from 'react';

interface ProjectSaveContextValue {
  lastSaveTime: number;
  isSaving: boolean;
  saveNow: () => Promise<void>;
}

const ProjectSaveContext = createContext<ProjectSaveContextValue | null>(null);

export function useProjectSave() {
  const context = useContext(ProjectSaveContext);

  if (!context) {
    // Return defaults if context not available
    return {
      lastSaveTime: 0,
      isSaving: false,
      saveNow: async () => {
        throw new Error('Project save context not available');
      },
    };
  }

  return context;
}

interface ProjectSaveProviderProps {
  value: ProjectSaveContextValue;
  children: ReactNode;
}

export function ProjectSaveProvider({ value, children }: ProjectSaveProviderProps) {
  return <ProjectSaveContext.Provider value={value}>{children}</ProjectSaveContext.Provider>;
}
