-- Migration: Add Message Notifications Support
-- Adds user activity tracking, email notification rate limiting, and helper functions

-- ============================================
-- 1. Add last_active column to users table
-- ============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE INDEX IF NOT EXISTS users_last_active_idx ON public.users(last_active);

-- ============================================
-- 2. Add email notification tracking to conversations
-- ============================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS email_notified_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS conversations_email_notified_at_idx ON public.conversations(email_notified_at);

-- ============================================
-- 3. Create email rate limits table
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT email_rate_limits_date_unique UNIQUE (date)
);

CREATE INDEX IF NOT EXISTS email_rate_limits_date_idx ON public.email_rate_limits(date);

-- Enable RLS
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no direct client access)
CREATE POLICY "Service role only" ON public.email_rate_limits
  FOR ALL USING (false);

-- ============================================
-- 4. Function to update user activity (debounced)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_activity(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if last_active is older than 1 minute (debounce)
  UPDATE public.users
  SET last_active = NOW()
  WHERE id = p_user_id
    AND last_active < NOW() - INTERVAL '1 minute';
END;
$$;

-- ============================================
-- 5. Function to increment daily email count
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_email_count(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Upsert and increment atomically
  INSERT INTO public.email_rate_limits (date, count)
  VALUES (p_date, 1)
  ON CONFLICT (date)
  DO UPDATE SET count = email_rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

-- ============================================
-- 6. Function to check email count for today
-- ============================================
CREATE OR REPLACE FUNCTION public.get_email_count(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count INTO v_count
  FROM public.email_rate_limits
  WHERE date = p_date;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- 7. Function to check if user is active
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_active(p_user_id UUID, p_threshold_minutes INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_active TIMESTAMPTZ;
BEGIN
  SELECT last_active INTO v_last_active
  FROM public.users
  WHERE id = p_user_id;

  IF v_last_active IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_last_active > NOW() - (p_threshold_minutes || ' minutes')::INTERVAL;
END;
$$;
