-- Add rules array to communities
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}';
