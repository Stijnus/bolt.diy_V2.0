# Complete Guide to Fix Project Issues

## Problem Summary
You can create projects but cannot view, edit, or delete them. This is caused by missing or incomplete Row Level Security (RLS) policies in your Supabase database.

## Root Cause
The database has RLS enabled but is missing the essential policies that allow project owners to:
1. View their own projects (SELECT)
2. Update their own projects (UPDATE)
3. Delete their own projects (DELETE)

## Solution Steps

### Step 1: Run Diagnostic Script (Optional)
First, identify what's wrong by running the diagnostic script in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open and run: `diagnose-projects.sql`
3. Review the output to see missing policies

### Step 2: Apply the Complete Fix
Run the comprehensive fix script in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `fix-projects-complete.sql`
3. Paste and **Execute** the SQL
4. Verify the output shows all policies were created successfully

### Step 3: Verify the Fix
After running the fix script, you should see output showing:
- 5 policies on the `projects` table
- 5 policies on the `project_collaborators` table

The policies created are:

**For `projects` table:**
- `Users can view own projects` (SELECT)
- `Anyone can view public projects` (SELECT)
- `Users can create projects` (INSERT)
- `Users can update own projects` (UPDATE)
- `Users can delete own projects` (DELETE)

**For `project_collaborators` table:**
- `Users can view their collaborations` (SELECT)
- `Project owners can view collaborators` (SELECT)
- `Project owners can add collaborators` (INSERT)
- `Project owners can update collaborators` (UPDATE)
- `Project owners can remove collaborators` (DELETE)

### Step 4: Test in Your Application
1. Refresh your application
2. Try to:
   - ✅ Create a new project
   - ✅ View your projects
   - ✅ Delete a project
   - ✅ (Later) Update a project

## What Was Wrong?

### Missing Policies
The database only had:
- Policy to view public projects
- Policy for managing collaborators

But was MISSING:
- Policy for owners to view their OWN projects
- Policy for owners to update their projects
- Policy for owners to delete their projects

### Why This Happened
RLS (Row Level Security) in PostgreSQL/Supabase works as a **whitelist**. If there's no policy explicitly allowing an operation, it's denied by default. Even though users created projects successfully (because the INSERT policy existed), they couldn't see, edit, or delete them because those policies were missing.

## Technical Details

### How RLS Policies Work
Each policy has:
- **Command**: SELECT, INSERT, UPDATE, or DELETE
- **USING clause**: Determines which rows the user can access
- **WITH CHECK clause** (for INSERT/UPDATE): Validates new/updated data

### Example Policy
```sql
CREATE POLICY "Users can delete own projects"
  ON public.projects 
  FOR DELETE
  USING (auth.uid() = user_id);
```

This means: "Users can delete rows from projects table where the user_id column matches their authenticated user ID"

## Common Issues & Solutions

### Issue: Still can't see projects after fix
**Solution**: 
1. Check that you're logged in (run: `SELECT auth.uid()` in SQL Editor)
2. Verify the projects belong to your user_id
3. Clear browser cache and refresh

### Issue: Can create but still can't delete
**Solution**: 
1. Run the diagnostic script again
2. Check if the DELETE policy exists
3. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'projects';`

### Issue: Policies exist but still don't work
**Solution**:
1. Check if the `user_id` on projects matches your `auth.uid()`
2. Run: `SELECT id, name, user_id FROM projects WHERE user_id = auth.uid();`
3. If no results, the user_id might be incorrect

## Files Created
- `diagnose-projects.sql` - Identifies issues
- `fix-projects-complete.sql` - Complete fix with all policies
- `FIX_PROJECTS_GUIDE.md` - This guide

## Support
If issues persist after following this guide:
1. Run the diagnostic script and share the output
2. Check browser console for any Supabase errors
3. Verify your Supabase environment variables are correct