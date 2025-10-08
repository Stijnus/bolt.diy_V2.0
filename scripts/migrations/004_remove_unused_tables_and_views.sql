-- Migration: Remove Unused Tables and Views
-- Date: 2025-01-08
-- Description: Drop unused model_preferences and usage_tracking tables, plus usage views
-- Reason: These features are not implemented in the current codebase and cause performance/security issues

-- ========================================
-- Step 1: Drop unused views (security risk)
-- ========================================

-- Drop security definer views that are unused and pose security risks
DROP VIEW IF EXISTS public.usage_by_month CASCADE;
DROP VIEW IF EXISTS public.usage_by_day CASCADE;
DROP VIEW IF EXISTS public.usage_by_provider CASCADE;

-- ========================================
-- Step 2: Drop unused indexes on tables to be removed
-- ========================================

-- Drop indexes on model_preferences table
DROP INDEX IF EXISTS public.idx_model_preferences_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_model_preferences_provider CASCADE;
DROP INDEX IF EXISTS public.idx_model_preferences_is_default CASCADE;

-- Drop indexes on usage_tracking table
DROP INDEX IF EXISTS public.idx_usage_tracking_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_usage_tracking_provider CASCADE;
DROP INDEX IF EXISTS public.idx_usage_tracking_timestamp CASCADE;
DROP INDEX IF EXISTS public.idx_usage_tracking_user_timestamp CASCADE;

-- ========================================
-- Step 3: Drop unused tables
-- ========================================

-- Drop foreign key constraints first (if any exist)
-- Note: No foreign keys to these tables were found in the analysis

-- Drop model_preferences table (unused - no implementation found)
DROP TABLE IF EXISTS public.model_preferences CASCADE;

-- Drop usage_tracking table (unused - no implementation found)
DROP TABLE IF EXISTS public.usage_tracking CASCADE;

-- ========================================
-- Step 4: Verification
-- ========================================

-- Verify tables are removed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_preferences' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'model_preferences table still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'usage_tracking table still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'usage_by_month' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'usage_by_month view still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'usage_by_day' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'usage_by_day view still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'usage_by_provider' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'usage_by_provider view still exists';
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Removed unused tables (model_preferences, usage_tracking) and views (usage_by_*)';
END $$;