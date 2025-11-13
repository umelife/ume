-- Migration: Add missing RLS policies for users and messages
-- This fixes the "new row violates row-level security policy" errors

-- Add INSERT policy for users table (allows users to create their own profile)
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add UPDATE policy for messages table (allows users to mark messages as read)
CREATE POLICY IF NOT EXISTS "Users can update messages where they are receiver"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);
