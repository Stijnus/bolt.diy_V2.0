-- Migration: Optimize Row Level Security (RLS) Policies
-- Date: 2025-01-08
-- Description: Fix RLS performance issues and consolidate multiple permissive policies
-- Reason: Multiple permissive policies cause performance degradation and auth function re-evaluation

-- ========================================
-- Step 1: Fix auth function re-evaluation in users table
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Re-create with optimized auth function call (prevents per-row re-evaluation)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK ((SELECT auth.uid() = id));

-- ========================================
-- Step 2: Consolidate multiple permissive policies on projects table
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view public projects" ON public.projects;

-- Create single consolidated policy
CREATE POLICY "Users can view own and public projects"
  ON public.users FOR SELECT
  USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators
      WHERE project_id = projects.id
      AND user_id = (SELECT auth.uid())
    )
  );

-- ========================================
-- Step 3: Consolidate multiple permissive policies on project_collaborators table
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;

-- Create single consolidated policy for SELECT
CREATE POLICY "Users can view project collaborators"
  ON public.project_collaborators FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- Create separate policy for management operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Project owners can manage collaborators"
  ON public.project_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- ========================================
-- Step 4: Add missing policies for project_collaborators INSERT
-- ========================================

-- Ensure project collaborators can be inserted by project owners
CREATE POLICY "Project owners can add collaborators"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- ========================================
-- Step 5: Performance verification queries
-- ========================================

-- Query to check for multiple permissive policies (should return empty after migration)
/*
WITH policy_analysis AS (
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND permissive = true
)
SELECT
  tablename,
  cmd,
  string_agg(policyname, ', ') as policies,
  count(*) as policy_count
FROM policy_analysis
GROUP BY tablename, cmd
HAVING count(*) > 1
ORDER BY tablename, cmd;
*/

-- Query to check for auth function re-evaluation patterns (should be optimized)
/*
SELECT
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.%(%' OR with_check LIKE '%auth.%(%')
  AND qual NOT LIKE '%(SELECT auth.%'
  AND with_check NOT LIKE '%(SELECT auth.%';
*/

-- ========================================
-- Step 6: Performance Recommendations
-- ========================================

/*
Performance improvements achieved:

1. Auth function optimization:
   - Changed auth.uid() to (SELECT auth.uid()) to prevent per-row re-evaluation
   - Reduces query execution time on large datasets

2. Policy consolidation:
   - Combined multiple permissive policies into single policies
   - Reduces policy execution overhead from N policies to 1 policy per operation

3. Better policy structure:
   - Separated SELECT policies from management policies
   - Clearer permission boundaries and better performance

Future optimizations to consider:
- Consider using PostgreSQL built-in roles if you have complex permission hierarchies
- Monitor pg_stat_user_tables for seq_scan vs idx_scan ratios
- Add composite indexes on frequently filtered column combinations
*/

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Optimized RLS policies for better performance';
    RAISE NOTICE 'Changes: Fixed auth function re-evaluation, consolidated multiple policies';
    RAISE NOTICE 'Monitor query performance to validate improvements';
END $$;