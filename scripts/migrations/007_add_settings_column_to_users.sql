-- Migration: Add Missing Settings Column to Users Table
-- Date: 2025-01-08
-- Description: Add settings JSONB column to users table (used in code but missing from schema)
-- Reason: The codebase stores user settings in this column but it was not defined in schema.sql

-- ========================================
-- Step 1: Add settings column to users table
-- ========================================

-- Add settings column with JSONB type and default empty object
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- ========================================
-- Step 2: Add column comment
-- ========================================

COMMENT ON COLUMN public.users.settings IS 'User preferences and settings stored as JSON object (editor settings, AI preferences, etc.)';

-- ========================================
-- Step 3: Create index on settings if needed for queries
-- ========================================

-- Note: Only create GIN index if you frequently query inside the JSONB
-- For now, we'll skip the index to optimize write performance
-- Uncomment the following line if you need to query JSONB contents frequently:
-- CREATE INDEX IF NOT EXISTS idx_users_settings_gin ON public.users USING GIN (settings);

-- ========================================
-- Step 4: Verify column was added correctly
-- ========================================

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND column_name = 'settings'
    ) THEN
        RAISE EXCEPTION 'Settings column was not added to users table';
    END IF;

    -- Check if column has correct type
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND column_name = 'settings'
        AND data_type = 'jsonb'
    ) THEN
        RAISE EXCEPTION 'Settings column does not have JSONB type';
    END IF;

    -- Check if default value is set
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND column_name = 'settings'
        AND column_default IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Settings column does not have default value';
    END IF;
END $$;

-- ========================================
-- Step 5: Update existing users to have settings (if any exist)
-- ========================================

-- Ensure all existing users have settings initialized
UPDATE public.users
SET settings = '{}'::jsonb
WHERE settings IS NULL;

-- ========================================
-- Step 6: Update RLS policy to handle settings column
-- ========================================

-- Update the "Users can update own profile" policy to allow settings updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- Step 7: Example usage and validation
-- ========================================

-- Test query to verify settings column works (commented out)
/*
-- Test inserting a user with settings
INSERT INTO public.users (id, email, settings)
VALUES ('test-uuid', 'test@example.com', '{"theme": "dark", "editor": {"fontSize": 14}}')
ON CONFLICT (id) DO NOTHING;

-- Test updating settings
UPDATE public.users
SET settings = jsonb_set(settings, '{theme}', '"light"')
WHERE id = 'test-uuid';

-- Test querying settings
SELECT settings->>'theme' as theme, settings->'editor'->>'fontSize' as fontSize
FROM public.users
WHERE id = 'test-uuid';
*/

-- ========================================
-- Step 8: Performance considerations
-- ========================================

/*
Settings column performance notes:

1. JSONB vs JSON:
   - Using JSONB for better performance and indexing capabilities
   - JSONB stores data in a decomposed binary format

2. Indexing strategy:
   - GIN index: Good for querying inside JSONB documents
   - B-tree index: Good for querying entire JSONB values
   - No index: Best for write-heavy workloads with simple storage

3. Query patterns:
   - Simple key access: settings->>'key'
   - Nested access: settings->'nested'->>'key'
   - Existence check: settings ? 'key'
   - Contains: settings @> '{"key": "value"}'

4. Storage considerations:
   - JSONB adds ~1-2 bytes overhead compared to plain text
   - Compresses well with TOAST (PostgreSQL's storage system)
*/

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added settings column to users table';
    RAISE NOTICE 'Settings column: JSONB type, default {}::jsonb, indexed for performance if needed';
    RAISE NOTICE 'Users can now store preferences and settings in the database';
END $$;