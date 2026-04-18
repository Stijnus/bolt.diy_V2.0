-- Migration: Remove legacy project tables and chat project references
-- Date: 2026-04-18
-- Description: Drops the legacy projects/project_collaborators tables and
-- removes the unused project_id column from chats.

-- Drop chats foreign key and legacy column if they still exist.
ALTER TABLE public.chats
DROP CONSTRAINT IF EXISTS chats_project_id_fkey;

DROP INDEX IF EXISTS idx_chats_project_id;

ALTER TABLE public.chats
DROP COLUMN IF EXISTS project_id;

-- Drop legacy project policies if they still exist.
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;

-- Drop legacy triggers and indexes.
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_project_collaborators_project_id;
DROP INDEX IF EXISTS idx_project_collaborators_user_id;

-- Drop legacy tables.
DROP TABLE IF EXISTS public.project_collaborators;
DROP TABLE IF EXISTS public.projects;
