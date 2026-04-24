-- Migration: Add shipping and fulfillment support
-- Adds fulfillment_type, payment options, and package dimensions to listings
-- Adds EasyPost tracking + shipping cost fields to orders

-- Listings: fulfillment type + accepted payment methods + shipping dimensions
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'in_person'
    CHECK (fulfillment_type IN ('in_person', 'shipping', 'both')),
  ADD COLUMN IF NOT EXISTS accepts_stripe BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ships_from_zip TEXT,
  ADD COLUMN IF NOT EXISTS weight_oz INTEGER,
  ADD COLUMN IF NOT EXISTS pkg_length DECIMAL,
  ADD COLUMN IF NOT EXISTS pkg_width  DECIMAL,
  ADD COLUMN IF NOT EXISTS pkg_height DECIMAL;

-- Orders: EasyPost tracking + shipping cost + fulfillment type
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS easypost_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS easypost_rate_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_shipping_address JSONB;
