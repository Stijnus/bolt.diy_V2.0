-- ========================================
-- PROJECT DIAGNOSTICS SCRIPT
-- Run this to identify what's wrong
-- ========================================

-- Check 1: List all current policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename IN ('projects', 'project_collaborators')
ORDER BY tablename, policyname;

-- Check 2: Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('projects', 'project_collaborators');

-- Check 3: Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Check 4: Count projects by user
SELECT 
  user_id,
  COUNT(*) as project_count
FROM public.projects
GROUP BY user_id;

-- Check 5: Check if there are any projects without users
SELECT 
  p.id,
  p.name,
  p.user_id,
  CASE 
    WHEN u.id IS NULL THEN 'USER NOT FOUND'
    ELSE 'OK'
  END as user_status
FROM public.projects p
LEFT JOIN public.users u ON u.id = p.user_id;

-- Check 6: List all collaborators
SELECT 
  pc.project_id,
  p.name as project_name,
  pc.user_id,
  pc.role,
  u.email as collaborator_email
FROM public.project_collaborators pc
LEFT JOIN public.projects p ON p.id = pc.project_id
LEFT JOIN public.users u ON u.id = pc.user_id
ORDER BY p.name, pc.role;

-- Check 7: Test if current user can see any projects
SELECT 
  id,
  name,
  user_id,
  visibility,
  CASE 
    WHEN user_id = auth.uid() THEN 'OWNER'
    WHEN visibility = 'public' THEN 'PUBLIC'
    ELSE 'NO ACCESS'
  END as access_reason
FROM public.projects
ORDER BY created_at DESC
LIMIT 10;