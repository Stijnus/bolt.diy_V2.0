-- Fix RLS policies for projects table
-- This addresses the infinite recursion issue

-- First, disable RLS temporarily to clear existing policies
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for projects table
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Public projects policy (separate to avoid recursion)
CREATE POLICY "Anyone can view public projects"
  ON public.projects FOR SELECT
  USING (visibility = 'public');

-- Check project_collaborators policies too (these might be causing the issue)
-- Drop existing collaborators policies
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;

-- Create simple collaborators policies
CREATE POLICY "Users can view their collaborations"
  ON public.project_collaborators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can manage collaborators"
  ON public.project_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_collaborators.project_id 
      AND user_id = auth.uid()
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'project_collaborators');