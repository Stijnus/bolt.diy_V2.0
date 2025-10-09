-- ====================================
-- BoltDIY V2.0 - Simplified Database Schema
-- ====================================
-- This schema is optimized for the improved persistence system
-- with only essential tables for user management and chat history
--
-- Key improvements:
-- - Simplified structure with only essential tables
-- - Proper multi-user chat support with (user_id, url_id) uniqueness
-- - Enhanced file state storage for project restoration
-- - Origin tracking (local vs remote chats)
-- - Automatic user profile creation on signup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. USERS TABLE
-- ====================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL
);

-- Comment on settings column
COMMENT ON COLUMN public.users.settings IS 'User preferences and settings stored as JSON object (editor settings, AI preferences, etc.)';

-- ====================================
-- 2. CHATS TABLE
-- ====================================
-- Core chat storage with enhanced file state support
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url_id TEXT NOT NULL,
  description TEXT,
  messages JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  model TEXT,
  file_state JSONB DEFAULT '{}' NOT NULL,
  origin TEXT DEFAULT 'local' NOT NULL CHECK (origin IN ('local', 'remote')),

  -- Ensure unique constraint on (user_id, url_id) for proper multi-user support
  CONSTRAINT chats_user_id_url_id_unique UNIQUE (user_id, url_id)
);

-- Comment on file_state column
COMMENT ON COLUMN public.chats.file_state IS 'Stores the complete file state (path -> {content, isBinary}) at the time of the last message';
COMMENT ON COLUMN public.chats.origin IS 'Tracks whether the chat originated locally or was synced from remote storage';

-- ====================================
-- 3. INDEXES FOR PERFORMANCE
-- ====================================
-- Essential indexes for chat queries
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS chats_url_id_idx ON public.chats(url_id);
CREATE INDEX IF NOT EXISTS chats_created_at_idx ON public.chats(created_at DESC);
CREATE INDEX IF NOT EXISTS chats_updated_at_idx ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS chats_user_url_id_idx ON public.chats(user_id, url_id);

-- ====================================
-- 4. AUTO-UPDATE TIMESTAMP FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================
-- 5. UPDATE TRIGGERS
-- ====================================
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;

-- ====================================
-- 7. RLS POLICIES
-- ====================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON public.chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.chats FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 8. AUTO-CREATE USER PROFILE
-- ====================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================
-- SETUP COMPLETE
-- ====================================
-- Your database is now ready to use with the improved persistence system!
--
-- KEY FEATURES:
-- ✅ Simplified schema with only essential tables
-- ✅ Proper multi-user chat support
-- ✅ Enhanced file state storage for project restoration
-- ✅ Origin tracking for local vs remote chats
-- ✅ Automatic user profile creation
-- ✅ Optimized indexes for performance
-- ✅ Row Level Security for data protection
--
-- Next steps:
-- 1. Enable Email authentication in Supabase Dashboard > Authentication > Providers
-- 2. Configure your site URL in Supabase Dashboard > Authentication > URL Configuration
-- 3. Enable leaked password protection in Supabase Dashboard > Authentication > Settings
-- 4. Run your application: npm run dev
-- 5. The improved persistence system will automatically repair any database issues on startup