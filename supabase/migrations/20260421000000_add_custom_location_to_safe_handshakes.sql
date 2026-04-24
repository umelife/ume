-- Add custom meetup location support to safe_handshakes.
-- When parties want to meet somewhere other than a predefined Blue Light safe-point,
-- they can store a plain-text name plus GPS coordinates here.
-- safe_point_id remains NULL for custom-location sessions.

ALTER TABLE public.safe_handshakes
  ADD COLUMN IF NOT EXISTS custom_location_text TEXT,
  ADD COLUMN IF NOT EXISTS custom_lat  FLOAT8,
  ADD COLUMN IF NOT EXISTS custom_lng  FLOAT8;
