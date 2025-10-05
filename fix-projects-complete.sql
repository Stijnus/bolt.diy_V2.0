-- ========================================
-- COMPREHENSIVE PROJECT DATABASE FIX
-- This script fixes all RLS policies and permissions
-- ========================================

-- Step 1: Disable RLS temporarily to clear everything
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view public projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their collaborations" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;

-- Step 3: Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Step 4: Create complete set of policies for projects table
-- Policy 1: Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON public.projects 
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Anyone can view public projects
CREATE POLICY "Anyone can view public projects"
  ON public.projects 
  FOR SELECT
  USING (visibility = 'public');

-- Policy 3: Users can create projects (with proper user_id)
CREATE POLICY "Users can create projects"
  ON public.projects 
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects 
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON public.projects 
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Create policies for project_collaborators table
-- Policy 1: Users can view their own collaboration records
CREATE POLICY "Users can view their collaborations"
  ON public.project_collaborators 
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Project owners can view all collaborators of their projects
CREATE POLICY "Project owners can view collaborators"
  ON public.project_collaborators 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_collaborators.project_id 
      AND user_id = auth.uid()
    )
  );

-- Policy 3: Project owners can add collaborators
CREATE POLICY "Project owners can add collaborators"
  ON public.project_collaborators 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_collaborators.project_id 
      AND user_id = auth.uid()
    )
  );

-- Policy 4: Project owners can update collaborator roles
CREATE POLICY "Project owners can update collaborators"
  ON public.project_collaborators 
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_collaborators.project_id 
      AND user_id = auth.uid()
    )
  );

-- Policy 5: Project owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators"
  ON public.project_collaborators 
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_collaborators.project_id 
      AND user_id = auth.uid()
    )
  );

-- Step 6: Verify all policies are in place
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN length(qual) > 50 THEN substring(qual, 1, 50) || '...'
    ELSE qual
  END as qual_preview
FROM pg_policies 
WHERE tablename IN ('projects', 'project_collaborators')
ORDER BY tablename, cmd, policyname;

-- Step 7: Check if there are any projects and their owners
SELECT 
  p.id,
  p.name,
  p.user_id,
  u.email as owner_email,
  p.visibility,
  p.created_at
FROM public.projects p
LEFT JOIN public.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 10;

-- Done! All policies should now be correctly configured.