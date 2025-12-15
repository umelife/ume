-- ============================================================================
-- RECLAIM Marketplace: Location-based Radius Filtering
-- ============================================================================
-- This SQL file sets up PostGIS extensions and creates a function to filter
-- listings by radius distance from user's location.
--
-- Run this in Supabase SQL Editor ONCE before using radius filtering.
-- ============================================================================

-- Step 1: Enable PostGIS extension for geospatial calculations
-- PostGIS provides distance calculation functions like ST_Distance
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Add latitude and longitude columns to listings table (if they don't exist)
-- These will store the location of each listing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN longitude double precision;
  END IF;
END $$;

-- Step 3: Add spatial index for faster location queries
-- This index uses PostGIS geography type for accurate distance calculations
CREATE INDEX IF NOT EXISTS listings_location_idx
ON public.listings USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);

-- Step 4: Create RPC function for radius filtering
-- This function returns listings within a specified radius (in miles) from user's location
--
-- Parameters:
--   user_lat: User's latitude
--   user_lng: User's longitude
--   radius_miles: Search radius in miles
--   category_filter: Optional category to filter by (NULL = all categories)
--
-- Returns: All listing columns plus distance_miles
CREATE OR REPLACE FUNCTION public.filter_by_radius(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  price numeric,
  image_urls text[],
  created_at timestamp with time zone,
  condition text,
  features text[],
  brand text,
  color text,
  size text,
  material text,
  latitude double precision,
  longitude double precision,
  distance_miles double precision
)
LANGUAGE plpgsql
AS $$
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
    -- Calculate distance in miles using ST_Distance (returns meters)
    -- ST_Distance_Sphere is faster but less accurate, ST_DistanceSpheroid is most accurate
    CAST(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography
      ) * 0.000621371 AS double precision  -- Convert meters to miles
    ) AS distance_miles
  FROM public.listings l
  WHERE
    -- Only include listings that have location data
    l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
    -- Filter by radius (convert miles to meters for ST_DWithin)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
    -- Optional category filter
    AND (category_filter IS NULL OR l.category = category_filter)
  ORDER BY distance_miles ASC;  -- Return closest listings first
END;
$$;

-- Step 5: Grant execute permission on the function
-- This allows authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- 1. Check if PostGIS extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'postgis';

-- 2. Check if latitude/longitude columns exist
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'listings' AND column_name IN ('latitude', 'longitude');

-- 3. Check if spatial index exists
-- SELECT indexname FROM pg_indexes WHERE tablename = 'listings' AND indexname = 'listings_location_idx';

-- 4. Test the radius function (example: 10 miles from a test location)
-- SELECT id, title, distance_miles FROM public.filter_by_radius(40.7128, -74.0060, 10, NULL);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
-- Uncomment and run this to add test location data to existing listings:
--
-- UPDATE public.listings
-- SET latitude = 40.7128 + (random() * 0.5 - 0.25),  -- Random lat near NYC
--     longitude = -74.0060 + (random() * 0.5 - 0.25) -- Random lng near NYC
-- WHERE latitude IS NULL;
