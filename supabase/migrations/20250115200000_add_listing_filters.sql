-- Add advanced filtering fields to listings table
-- This migration adds condition, features, and seller rating fields

-- ============================================================================
-- 1. ADD NEW COLUMNS TO LISTINGS TABLE
-- ============================================================================

-- Add condition field (enum-like)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Used' CHECK (
    condition IN ('New', 'Like New', 'Used', 'Refurbished', 'For Parts')
  );

-- Add features array (for product-specific attributes)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add brand field
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS brand TEXT NULL;

-- Add color field
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS color TEXT NULL;

-- Add size field
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS size TEXT NULL;

-- Add material field
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS material TEXT NULL;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS listings_condition_idx ON public.listings(condition);
CREATE INDEX IF NOT EXISTS listings_features_idx ON public.listings USING GIN(features);
CREATE INDEX IF NOT EXISTS listings_brand_idx ON public.listings(brand);

-- ============================================================================
-- 2. ADD SELLER RATING COMPUTED FIELD
-- ============================================================================

-- For now, we'll add a placeholder seller_rating column
-- In production, this would be computed from feedback/reviews table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (
    seller_rating >= 0 AND seller_rating <= 5
  );

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT false;

-- Add indices
CREATE INDEX IF NOT EXISTS users_seller_rating_idx ON public.users(seller_rating DESC);
CREATE INDEX IF NOT EXISTS users_verified_seller_idx ON public.users(verified_seller);

-- ============================================================================
-- 3. UPDATE EXISTING DATA WITH DEFAULT VALUES
-- ============================================================================

-- Set default condition for existing listings
UPDATE public.listings
SET condition = 'Used'
WHERE condition IS NULL;

-- Set default features
UPDATE public.listings
SET features = ARRAY[]::TEXT[]
WHERE features IS NULL;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.listings.condition IS 'Physical condition of the item (New, Like New, Used, Refurbished, For Parts)';
COMMENT ON COLUMN public.listings.features IS 'Array of product-specific features/attributes';
COMMENT ON COLUMN public.listings.brand IS 'Brand name of the product';
COMMENT ON COLUMN public.listings.color IS 'Color of the product';
COMMENT ON COLUMN public.listings.size IS 'Size of the product (clothing, shoes, etc.)';
COMMENT ON COLUMN public.listings.material IS 'Material composition';
COMMENT ON COLUMN public.users.seller_rating IS 'Average seller rating (0-5 stars)';
COMMENT ON COLUMN public.users.total_sales IS 'Total number of completed sales';
COMMENT ON COLUMN public.users.verified_seller IS 'Whether seller is verified/trusted';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'listings'
AND column_name IN ('condition', 'features', 'brand', 'color', 'size', 'material')
ORDER BY column_name;

DO $$
BEGIN
  RAISE NOTICE '✅ Listing filters migration applied successfully!';
  RAISE NOTICE '📋 New fields added:';
  RAISE NOTICE '  - condition (TEXT with CHECK constraint)';
  RAISE NOTICE '  - features (TEXT[] array)';
  RAISE NOTICE '  - brand, color, size, material (TEXT)';
  RAISE NOTICE '  - seller_rating on users table';
END $$;
