import { supabase } from '~/lib/supabase/client';
import type { Database } from '~/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type Collaborator = Database['public']['Tables']['project_collaborators']['Row'];

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
      console.error('Create project error:', error);
      throw new Error(error.message || 'Failed to create project');
    }

    return project;
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });

    if (error) {
      console.error('Get projects error:', error);
      throw new Error(error.message || 'Failed to load projects');
    }

    return data;
  }

  async getProject(id: string): Promise<Project> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

    if (error) {
      console.error('Get project error:', error);
      throw new Error(error.message || 'Failed to load project');
    }

    return data;
  }

  async updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();

    if (error) {
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
      console.error('Share project error:', error);
      throw new Error(error.message || 'Failed to share project');
    }
  }

  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const { data, error } = await supabase.from('project_collaborators').select('*').eq('project_id', projectId);

    if (error) {
      console.error('Get collaborators error:', error);
      throw new Error(error.message || 'Failed to load collaborators');
    }

    return data;
  }

  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
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
      console.error('Update collaborator role error:', error);
      throw new Error(error.message || 'Failed to update collaborator role');
    }
  }
}

// singleton instance
export const projectService = new ProjectService();
