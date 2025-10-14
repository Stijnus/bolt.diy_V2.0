-- Migration: Add file_state column to projects table for Phase 1 implementation
-- Purpose: Store project files to enable opening and restoring projects
-- Author: BoltDIY Development Team
-- Date: 2025-01-14

-- Add file_state column to projects table
-- Stores files as JSONB: { "path/to/file": { content: string, isBinary: boolean, encoding?: string } }
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS file_state JSONB DEFAULT NULL;

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_projects_file_state 
ON public.projects USING GIN (file_state);

-- Add comment to document the column
COMMENT ON COLUMN public.projects.file_state IS 
'Stores project file contents as JSONB. Format: { "path": { "content": string, "isBinary": boolean, "encoding": "plain"|"base64" } }. Max recommended size: 5MB per project.';

-- Update the updated_at trigger to fire on file_state changes (if trigger exists)
-- This ensures updated_at is refreshed when files are saved

-- Optional: Add a size limit check function (recommended to prevent bloat)
CREATE OR REPLACE FUNCTION check_project_file_state_size()
RETURNS TRIGGER AS $$
BEGIN
    -- Limit file_state to approximately 5MB (5,000,000 bytes)
    IF NEW.file_state IS NOT NULL AND 
       octet_length(NEW.file_state::text) > 5000000 THEN
        RAISE EXCEPTION 'file_state exceeds maximum size of 5MB';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce size limit
DROP TRIGGER IF EXISTS enforce_file_state_size ON public.projects;
CREATE TRIGGER enforce_file_state_size
    BEFORE INSERT OR UPDATE OF file_state ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION check_project_file_state_size();

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name = 'file_state';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Migration completed successfully! file_state column added to projects table.';
END $$;
