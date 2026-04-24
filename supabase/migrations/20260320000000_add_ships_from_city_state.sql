-- Migration: Add city and state to listing shipping from-address
-- Required for EasyPost label generation (full address needed)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS ships_from_street TEXT,
  ADD COLUMN IF NOT EXISTS ships_from_city TEXT,
  ADD COLUMN IF NOT EXISTS ships_from_state TEXT;
