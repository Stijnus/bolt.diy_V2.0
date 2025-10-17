-- Migration: create usage table and RLS policies
-- Run this file in Supabase SQL Editor or include in your deployment pipeline

-- Enable required extensions (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create usage table
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_id TEXT,
  message_id TEXT,
  provider TEXT,
  model_id TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS usage_user_id_idx ON public.usage(user_id);
CREATE INDEX IF NOT EXISTS usage_created_at_idx ON public.usage(created_at DESC);

-- RLS
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_select_own" ON public.usage;
DROP POLICY IF EXISTS "usage_insert_own" ON public.usage;
CREATE POLICY "usage_select_own" ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert_own" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);

