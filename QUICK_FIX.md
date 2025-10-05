# 🚀 Quick Fix for Project Issues

## The Problem
✗ Can create projects  
✗ Cannot view/edit/delete projects  

## The Solution
Missing database policies! Run this SQL in Supabase:

## 📋 Copy-Paste This SQL

```sql
-- Disable RLS temporarily
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view public projects" ON public.projects;

-- Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create all necessary policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public projects"
  ON public.projects FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Collaborators policies
CREATE POLICY "Users can view their collaborations"
  ON public.project_collaborators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can view collaborators"
  ON public.project_collaborators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Project owners can add collaborators"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Project owners can update collaborators"
  ON public.project_collaborators FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Project owners can remove collaborators"
  ON public.project_collaborators FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_collaborators.project_id 
    AND user_id = auth.uid()
  ));
```

## ✅ How to Apply

1. **Open Supabase Dashboard** → SQL Editor
2. **Paste** the SQL above
3. **Click Execute** or **Run**
4. **Refresh** your application

## 🎯 Expected Result
After running this:
- ✅ View your projects
- ✅ Edit your projects  
- ✅ Delete your projects
- ✅ Share with collaborators

## ⚠️ Still Not Working?

Run diagnostic:
```sql
-- Check if policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'projects';

-- Check your user ID
SELECT auth.uid();

-- Check your projects
SELECT id, name, user_id 
FROM projects 
WHERE user_id = auth.uid();
```

## 📚 Need More Info?
See `FIX_PROJECTS_GUIDE.md` for detailed explanation.