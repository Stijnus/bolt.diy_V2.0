import { createClient } from '~/lib/supabase/client';
import type { Database } from '~/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type Collaborator = Database['public']['Tables']['project_collaborators']['Row'];

export class ProjectService {
  private readonly _supabase = createClient();

  async createProject(data: Omit<ProjectInsert, 'user_id'>): Promise<Project> {
    const {
      data: { user },
    } = await this._supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be logged in to create a project');
    }

    const { data: project, error } = await this._supabase
      .from('projects')
      .insert({
        ...data,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return project;
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await this._supabase.from('projects').select('*').order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getProject(id: string): Promise<Project> {
    const { data, error } = await this._supabase.from('projects').select('*').eq('id', id).single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await this._supabase.from('projects').update(updates).eq('id', id).select().single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this._supabase.from('projects').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  async shareProject(projectId: string, userEmail: string, role: 'editor' | 'viewer'): Promise<void> {
    // get user by email
    const { data: targetUser } = await this._supabase.from('users').select('id').eq('email', userEmail).single();

    if (!targetUser) {
      throw new Error('User not found');
    }

    // add collaborator
    const { error } = await this._supabase.from('project_collaborators').insert({
      project_id: projectId,
      user_id: targetUser.id,
      role,
    });

    if (error) {
      throw error;
    }
  }

  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const { data, error } = await this._supabase.from('project_collaborators').select('*').eq('project_id', projectId);

    if (error) {
      throw error;
    }

    return data;
  }

  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const { error } = await this._supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  async updateCollaboratorRole(projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<void> {
    const { error } = await this._supabase
      .from('project_collaborators')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }
}

// singleton instance
export const projectService = new ProjectService();
