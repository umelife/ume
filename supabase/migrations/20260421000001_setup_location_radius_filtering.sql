-- ============================================================================
-- Location-based Radius Filtering — full setup + backfill
-- ============================================================================
-- Idempotent: safe to run multiple times.
-- Run this in Supabase SQL Editor if it hasn't been applied yet.
-- ============================================================================

-- 1. PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add columns to listings (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN longitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'location_geog'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN location_geog geography(Point, 4326);
  END IF;
END $$;

-- 3. Trigger function: keep location_geog in sync with lat/lng
CREATE OR REPLACE FUNCTION public.listings_location_geog_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location_geog := CASE
    WHEN NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
    ELSE NULL
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_location_geog_trig ON public.listings;
CREATE TRIGGER listings_location_geog_trig
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_location_geog_trigger();

-- 4. Spatial index
CREATE INDEX IF NOT EXISTS listings_location_geog_idx
ON public.listings USING GIST (location_geog);

-- 5. Backfill existing listings with campus centre coordinates.
--    The trigger auto-populates location_geog from lat/lng.
UPDATE public.listings
SET
  latitude  = CASE seller_campus_id
    WHEN 'uc_cumberlands' THEN 36.7435
    ELSE NULL
  END,
  longitude = CASE seller_campus_id
    WHEN 'uc_cumberlands' THEN -84.1570
    ELSE NULL
  END
WHERE latitude IS NULL
  AND seller_campus_id IS NOT NULL;

-- 6. Also backfill location_geog for any rows where lat/lng exist but geog is missing
UPDATE public.listings
SET location_geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_geog IS NULL;

-- 7. RPC function — includes seller_campus_id and status so callers can filter
CREATE OR REPLACE FUNCTION public.filter_by_radius(
  user_lat        double precision,
  user_lng        double precision,
  radius_miles    double precision,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  user_id          uuid,
  title            text,
  description      text,
  category         text,
  price            numeric,
  image_urls       text[],
  created_at       timestamp with time zone,
  condition        text,
  features         text[],
  brand            text,
  color            text,
  size             text,
  material         text,
  latitude         double precision,
  longitude        double precision,
  seller_campus_id text,
  status           text,
  distance_miles   double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.title,
    l.description,
    l.category,
    l.price,
    l.image_urls,
    l.created_at,
    l.condition,
    l.features,
    l.brand,
    l.color,
    l.size,
    l.material,
    l.latitude,
    l.longitude,
    l.seller_campus_id,
    l.status,
    CAST(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        l.location_geog
      ) * 0.000621371 AS double precision
    ) AS distance_miles
  FROM public.listings l
  WHERE
    l.location_geog IS NOT NULL
    AND l.status NOT IN ('sold', 'reserved')
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      l.location_geog,
      radius_miles * 1609.34
    )
    AND (category_filter IS NULL OR l.category = category_filter)
  ORDER BY distance_miles ASC;
END;
$$;

-- 8. Permissions
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO anon;
