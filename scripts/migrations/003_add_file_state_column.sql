-- Migration: Add file_state column to chats table
-- Date: 2025-01-08
-- Purpose: Store file state in chat history for complete project restoration

-- Add file_state column to chats table
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS file_state JSONB DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN public.chats.file_state IS 'Stores the complete file state (path -> {content, isBinary}) at the time of the last message';

-- Update existing chats to have an empty file_state by default
UPDATE public.chats SET file_state = '{}' WHERE file_state IS NULL;

-- Migration complete