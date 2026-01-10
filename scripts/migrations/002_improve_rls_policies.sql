-- ====================================
-- BoltDIY V2.0 - RLS Policies Improvements
-- ====================================
-- Best practices applied:
-- 1. Wrap auth.uid() as (SELECT auth.uid())
-- 2. Qualify all table references in subqueries
-- 3. Add policy for collaborators to view chats

-- ====================================
-- Drop and recreate all policies with improvements
-- ====================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = projects.id 
      AND pc.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Chats policies
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- NEW: Collaborators can view chats in their projects
DROP POLICY IF EXISTS "Collaborators can view project chats" ON public.chats;
CREATE POLICY "Collaborators can view project chats"
  ON public.chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = chats.project_id
      AND pc.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Collaborators policies
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
CREATE POLICY "Users can view collaborators of their projects"
  ON public.project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = (SELECT auth.uid())
    ) OR
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
CREATE POLICY "Project owners can manage collaborators"
  ON public.project_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = (SELECT auth.uid())
    )
  );

-- ====================================
-- Improvements Applied
-- ====================================
-- ✓ All auth.uid() calls wrapped as (SELECT auth.uid())
-- ✓ All table references qualified with table aliases
-- ✓ New policy: Collaborators can view chats in their projects
-- ✓ Better performance and security through explicit subquery handling
