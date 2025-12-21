-- Add college_name and college_address fields to users table
-- These fields store the user's college/university information

-- Add college_name column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS college_name text;

-- Add college_address column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS college_address text;

-- Create index for faster lookups by college name
CREATE INDEX IF NOT EXISTS users_college_name_idx
  ON public.users (college_name);

-- Update the handle_new_user trigger to include college fields
-- This preserves the existing trigger logic and adds college field support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
  attempt_count int := 0;
BEGIN
  -- Get username from metadata, or use email prefix as fallback
  new_username := COALESCE(
    NULLIF(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );

  -- Ensure username is not null or empty
  IF new_username IS NULL OR new_username = '' THEN
    new_username := split_part(new.email, '@', 1);
  END IF;

  -- Ensure username is unique (case-insensitive) by appending suffix if needed
  -- This is a safety mechanism in case of race conditions
  WHILE EXISTS (SELECT 1 FROM public.users WHERE lower(username) = lower(new_username)) AND attempt_count < 100 LOOP
    attempt_count := attempt_count + 1;
    new_username := COALESCE(
      NULLIF(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    ) || '-' || attempt_count::text;
  END LOOP;

  INSERT INTO public.users (
    id,
    email,
    display_name,
    username,
    university_domain,
    college_name,
    college_address,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    new_username, -- Use username as display_name for now (backwards compatibility)
    new_username,
    split_part(new.email, '@', 2),
    COALESCE(NULLIF(new.raw_user_meta_data->>'college_name', ''), ''),
    COALESCE(NULLIF(new.raw_user_meta_data->>'college_address', ''), ''),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on columns for documentation
COMMENT ON COLUMN public.users.college_name IS 'Name of the user''s college or university';
COMMENT ON COLUMN public.users.college_address IS 'Address of the user''s college or university';
