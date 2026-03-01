-- Safe-Handshake Feature Migration
-- Adds safe_handshakes table and listing status column for in-person verified exchanges

-- 1. Add status column to listings table (for reservation/sold tracking)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'reserved', 'sold'));

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

-- 2. Create safe_handshakes table
CREATE TABLE IF NOT EXISTS public.safe_handshakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN (
      'initiated',
      'in_progress',
      'seller_arrived',
      'buyer_arrived',
      'both_arrived',
      'qr_generated',
      'completed',
      'cancelled'
    )),
  safe_point_id TEXT,
  seller_arrived_at TIMESTAMPTZ,
  buyer_arrived_at TIMESTAMPTZ,
  qr_token TEXT,
  qr_token_expires_at TIMESTAMPTZ,
  qr_token_used BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seller_not_buyer CHECK (seller_id != buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_safe_handshakes_listing ON public.safe_handshakes(listing_id);
CREATE INDEX IF NOT EXISTS idx_safe_handshakes_seller ON public.safe_handshakes(seller_id);
CREATE INDEX IF NOT EXISTS idx_safe_handshakes_buyer ON public.safe_handshakes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_safe_handshakes_status ON public.safe_handshakes(status);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_safe_handshakes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS safe_handshakes_updated_at ON public.safe_handshakes;
CREATE TRIGGER safe_handshakes_updated_at
  BEFORE UPDATE ON public.safe_handshakes
  FOR EACH ROW EXECUTE FUNCTION update_safe_handshakes_updated_at();

-- 4. Row Level Security
ALTER TABLE public.safe_handshakes ENABLE ROW LEVEL SECURITY;

-- Participants can view their own handshakes
DROP POLICY IF EXISTS "Participants can view handshake" ON public.safe_handshakes;
CREATE POLICY "Participants can view handshake"
  ON public.safe_handshakes FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Participants can update their own handshakes
DROP POLICY IF EXISTS "Participants can update handshake" ON public.safe_handshakes;
CREATE POLICY "Participants can update handshake"
  ON public.safe_handshakes FOR UPDATE
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Authenticated users can create handshakes (as seller or buyer)
DROP POLICY IF EXISTS "Authenticated users can create handshake" ON public.safe_handshakes;
CREATE POLICY "Authenticated users can create handshake"
  ON public.safe_handshakes FOR INSERT
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Enable Realtime for the safe_handshakes table
-- This is free on all Supabase tiers — it uses PostgreSQL logical replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_handshakes;
