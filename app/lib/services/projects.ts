import { supabase } from '~/lib/supabase/client';

export type FileState = Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;

export interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  collaborator_count?: number;
  file_state?: FileState | null;
}

type ProjectInsert = Pick<Project, 'name' | 'description' | 'visibility'>;
type ProjectUpdate = Partial<Pick<Project, 'name' | 'description' | 'visibility'>>;

export type Collaborator = {
  id: number;
  project_id: string;
  user_id: string;
  role: 'editor' | 'viewer';
  created_at: string | null;
  email?: string | null;
};

export class ProjectService {
  async createProject(data: Omit<ProjectInsert, 'user_id'>): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentication required. Please sign in to create a project.');
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...data,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Create project error:', error);
      throw new Error(error.message || 'Failed to create project');
    }

    return project;
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_collaborators(count)')
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingProjectsTable(error)) {
        return [];
      }

      console.error('Get projects error:', error);
      throw new Error(error.message || 'Failed to load projects');
    }

    return (data ?? []).map((project: any) => ({
      ...project,
      collaborator_count: extractCollaboratorCount(project.project_collaborators),
    }));
  }

  async getProject(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_collaborators(count)')
      .eq('id', id)
      .single();

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Get project error:', error);
      throw new Error(error.message || 'Failed to load project');
    }

    return {
      ...data,
      collaborator_count: extractCollaboratorCount((data as any)?.project_collaborators),
    } as Project;
  }

  async updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Update project error:', error);

      if (error.code === 'PGRST116') {
        throw new Error('Project not found or you do not have permission to update it');
      }

      throw new Error(error.message || 'Failed to update project');
    }

    return data;
  }

  async deleteProject(id: string): Promise<void> {
    // verify user is authenticated before attempting delete
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentication required. Please sign in to delete projects.');
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Delete project error:', error);

      if (error.code === 'PGRST116') {
        throw new Error('Project not found or you do not have permission to delete it');
      }

      throw new Error(error.message || 'Failed to delete project');
    }
  }

  async shareProject(projectId: string, userEmail: string, role: 'editor' | 'viewer'): Promise<void> {
    // get user by email
    const { data: targetUser } = await supabase.from('users').select('id').eq('email', userEmail).single();

    if (!targetUser) {
      throw new Error('User not found');
    }

    // add collaborator
    const { error } = await supabase.from('project_collaborators').insert({
      project_id: projectId,
      user_id: targetUser.id,
      role,
    });

    if (error) {
      if (isMissingCollaboratorsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Share project error:', error);
      throw new Error(error.message || 'Failed to share project');
    }
  }

  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const { data, error } = await supabase
      .from('project_collaborators')
      .select('id, project_id, user_id, role, created_at, users(email)')
      .eq('project_id', projectId);

    if (error) {
      if (isMissingCollaboratorsTable(error)) {
        return [];
      }

      console.error('Get collaborators error:', error);
      throw new Error(error.message || 'Failed to load collaborators');
    }

    return (data ?? []).map(
      (item: {
        id: number;
        project_id: string;
        user_id: string;
        role: 'editor' | 'viewer';
        created_at: string | null;
        users?: { email?: string | null } | null;
      }) => ({
        id: item.id,
        project_id: item.project_id,
        user_id: item.user_id,
        role: item.role,
        created_at: item.created_at,
        email: item.users?.email ?? null,
      }),
    );
  }

  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      if (isMissingCollaboratorsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Remove collaborator error:', error);
      throw new Error(error.message || 'Failed to remove collaborator');
    }
  }

  async updateCollaboratorRole(projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      if (isMissingCollaboratorsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Update collaborator role error:', error);
      throw new Error(error.message || 'Failed to update collaborator role');
    }
  }

  /**
   * Save project files to Supabase
   * @param projectId - The project ID
   * @param fileState - The file state to save
   */
  async saveProjectFiles(projectId: string, fileState: FileState): Promise<void> {
    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentication required to save project files');
    }

    // Validate file state size (approximate 5MB limit)
    const fileStateString = JSON.stringify(fileState);
    const sizeInBytes = new Blob([fileStateString]).size;

    if (sizeInBytes > 5 * 1024 * 1024) {
      throw new Error('Project files exceed maximum size of 5MB');
    }

    const { error } = await supabase
      .from('projects')
      .update({ file_state: fileState, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id); // Ensure user owns the project

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Save project files error:', error);

      if (error.code === 'PGRST116') {
        throw new Error('Project not found or you do not have permission to save files');
      }

      throw new Error(error.message || 'Failed to save project files');
    }
  }

  /**
   * Get project files from Supabase
   * @param projectId - The project ID
   * @returns The file state or null if no files exist
   */
  async getProjectFiles(projectId: string): Promise<FileState | null> {
    const { data, error } = await supabase.from('projects').select('file_state').eq('id', projectId).single();

    if (error) {
      if (isMissingProjectsTable(error)) {
        throw missingProjectsTableError();
      }

      console.error('Get project files error:', error);

      if (error.code === 'PGRST116') {
        throw new Error('Project not found');
      }

      throw new Error(error.message || 'Failed to load project files');
    }

    return (data?.file_state as FileState) || null;
  }

  /**
   * Get the most recent chat ID associated with a project
   * @param projectId - The project ID
   * @returns The most recent chat ID or null
   */
  async getProjectLatestChatId(projectId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('id, url_id')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Get project latest chat error:', error);
      return null;
    }

    return data?.url_id || data?.id || null;
  }
}

function isMissingProjectsTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' && typeof error.message === 'string' && error.message.includes("'public.projects'");
}

function isMissingCollaboratorsTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST205' &&
    typeof error.message === 'string' &&
    error.message.includes("'public.project_collaborators'")
  );
}

function missingProjectsTableError(): Error {
  return new Error(
    'Projects feature is not yet provisioned in Supabase. Create the required tables or disable project selection until the schema is ready.',
  );
}

// singleton instance
export const projectService = new ProjectService();

function extractCollaboratorCount(value: any): number {
  if (!value) {
    return 0;
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];

    if (typeof first?.count === 'number') {
      return first.count;
    }
  }

  if (typeof value === 'number') {
    return value;
  }

  return 0;
}
