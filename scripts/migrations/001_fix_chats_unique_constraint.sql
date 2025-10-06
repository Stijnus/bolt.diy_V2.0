-- Migration: Fix chats table unique constraint
-- Date: 2025-10-06
-- Description: Changes url_id UNIQUE constraint to composite UNIQUE(url_id, user_id)
-- This allows different users to have chats with the same url_id

-- Step 1: Drop the old unique constraint on url_id
-- Note: Constraint names may vary, so we'll use ALTER TABLE DROP CONSTRAINT
DO $$
BEGIN
  -- Find and drop the unique constraint on url_id
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chats'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.chats'::regclass AND attname = 'url_id')
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.chats DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.chats'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.chats'::regclass AND attname = 'url_id')
      LIMIT 1
    );
  END IF;
END $$;

-- Step 2: Add the new composite unique constraint
ALTER TABLE public.chats
ADD CONSTRAINT chats_url_id_user_id_unique UNIQUE (url_id, user_id);

-- Step 3: Verify the constraint was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chats'::regclass
    AND conname = 'chats_url_id_user_id_unique'
  ) THEN
    RAISE EXCEPTION 'Failed to create unique constraint chats_url_id_user_id_unique';
  END IF;
END $$;
