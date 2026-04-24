-- Add seller_campus_id to listings
-- Uses canonical campus ID from CAMPUSES array in data/safe-points.ts
-- Never stores free-text — derived from seller's verified .edu email at listing creation
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS seller_campus_id TEXT;

-- Backfill existing listings by matching seller's email domain to known campus IDs
-- Add more WHEN clauses here as UME expands to new campuses
UPDATE listings
SET seller_campus_id = CASE
  WHEN users.email ILIKE '%@ucumberlands.edu'
    OR users.email ILIKE '%@students.ucumberlands.edu'
  THEN 'uc_cumberlands'
  -- WHEN users.email ILIKE '%@newcampus.edu' THEN 'new_campus_id'
END
FROM users
WHERE listings.user_id = users.id;

-- Index for fast campus filtering
CREATE INDEX IF NOT EXISTS idx_listings_seller_campus_id
  ON listings (seller_campus_id);
