-- Migration: Remove Unused Indexes on Active Tables
-- Date: 2025-01-08
-- Description: Drop indexes that have never been used according to database advisors
-- Reason: Unused indexes consume storage and slow down write operations

-- ========================================
-- Step 1: Drop unused indexes on active tables
-- ========================================

-- Drop unused indexes on projects table
DROP INDEX IF EXISTS public.idx_projects_user_id CASCADE;

-- Drop unused indexes on chats table
DROP INDEX IF EXISTS public.idx_chats_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_chats_url_id CASCADE;

-- Drop unused indexes on project_collaborators table
DROP INDEX IF EXISTS public.idx_project_collaborators_project_id CASCADE;
DROP INDEX IF EXISTS public.idx_project_collaborators_user_id CASCADE;

-- Drop unused indexes on users table
DROP INDEX IF EXISTS public.idx_users_settings CASCADE;

-- ========================================
-- Step 2: Verify important indexes still exist
-- ========================================

-- Note: The following indexes should be kept as they are likely needed:
-- - Primary key indexes (automatically created)
-- - Foreign key indexes (idx_chats_project_id was not marked as unused)
-- - Any indexes that are actually being used by queries

-- ========================================
-- Step 3: Analysis of why indexes were unused
-- ========================================

/*
The following indexes were identified as unused because:

1. idx_projects_user_id - Projects are likely queried with user_id + other filters
   or the query planner is using sequential scans due to small table size.

2. idx_chats_user_id - Chats are typically queried by (url_id, user_id)
   due to the unique constraint, making a single user_id index redundant.

3. idx_chats_url_id - Same reason as above, the composite unique constraint
   makes individual indexes less useful.

4. idx_project_collaborators_* - Collaboration queries typically need both
   project_id and user_id together, not individually.

5. idx_users_settings - Settings are stored in JSONB and likely accessed
   through the users table directly rather than filtered by settings content.

If query performance degrades, consider creating composite indexes that match
actual query patterns instead of single-column indexes.
*/

-- ========================================
-- Step 4: Optional performance monitoring
-- ========================================

-- Create a function to monitor index usage (optional, for future monitoring)
/*
CREATE OR REPLACE FUNCTION public.get_unused_indexes()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pg_stat_user_indexes.schemaname,
        pg_stat_user_indexes.relname AS tablename,
        pg_stat_user_indexes.indexrelname AS indexname,
        pg_stat_user_indexes.idx_scan,
        pg_stat_user_indexes.idx_tup_read,
        pg_stat_user_indexes.idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE pg_stat_user_indexes.idx_scan = 0
    AND pg_stat_user_indexes.schemaname = 'public'
    ORDER BY pg_stat_user_indexes.schemaname, pg_stat_user_indexes.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Removed unused indexes on active tables';
    RAISE NOTICE 'Monitor query performance and consider composite indexes if needed';
END $$;