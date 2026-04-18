-- ====================================
-- BoltDIY V2.0 - Complete Database Schema
-- ====================================
-- Run this script in your Supabase SQL Editor after creating a new project
-- Or use the automated setup script: npm run setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. USERS TABLE
-- ====================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- 2. CHATS TABLE
-- ====================================
-- Stores synced chat history
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url_id TEXT NOT NULL,
  description TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url_id, user_id)
);

-- ====================================
-- 3. INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_url_id ON public.chats(url_id);

-- ====================================
-- 4. AUTO-UPDATE TIMESTAMP FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 5. UPDATE TRIGGERS
-- ====================================
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at 
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- 7. AUTO-CREATE USER PROFILE
-- ====================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
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
-- Your database is now ready to use!
-- Next steps:
-- 1. Enable Email authentication in Supabase Dashboard > Authentication > Providers
-- 2. Configure your site URL in Supabase Dashboard > Authentication > URL Configuration
-- 3. Run your application: npm run dev
