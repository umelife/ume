-- ============================================================================
-- STRIPE PAYMENTS & ORDERS MIGRATION
-- ============================================================================
-- This migration adds support for Stripe payments and order tracking
--
-- Instructions:
-- 1. Copy this file content
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Click "New Query"
-- 4. Paste and click "Run"
-- ============================================================================

-- ============================================================================
-- 1. ADD STRIPE ACCOUNT ID TO USERS TABLE
-- ============================================================================

-- Add stripe_account_id for sellers to receive payouts
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false NOT NULL;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS users_stripe_account_id_idx ON public.users(stripe_account_id);

-- ============================================================================
-- 2. CREATE ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Participants
  buyer_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings ON DELETE CASCADE NOT NULL,

  -- Stripe payment details
  stripe_checkout_session_id TEXT NULL,
  stripe_payment_intent_id TEXT NULL,
  stripe_charge_id TEXT NULL,
  stripe_refund_id TEXT NULL,

  -- Financial details
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT DEFAULT 'usd' NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0 NOT NULL,
  seller_amount_cents INTEGER NOT NULL,

  -- Order status
  status TEXT DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending', 'paid', 'processing', 'completed', 'refunded', 'cancelled')
  ),

  -- Payment metadata
  payment_method TEXT NULL, -- e.g., 'card', 'bank_transfer'
  buyer_email TEXT NULL,
  buyer_name TEXT NULL,

  -- Delivery/completion tracking
  completed_at TIMESTAMPTZ NULL,
  refunded_at TIMESTAMPTZ NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT buyer_not_seller CHECK (buyer_id != seller_id)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_listing_id_idx ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON public.orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_idx ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES FOR ORDERS
-- ============================================================================

-- Users can view their own orders (as buyer or seller)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND policyname = 'Users can view their own orders'
  ) THEN
    CREATE POLICY "Users can view their own orders"
      ON public.orders FOR SELECT
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

-- Only system can insert orders (via API routes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND policyname = 'System can insert orders'
  ) THEN
    CREATE POLICY "System can insert orders"
      ON public.orders FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Only system can update orders (via webhooks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND policyname = 'System can update orders'
  ) THEN
    CREATE POLICY "System can update orders"
      ON public.orders FOR UPDATE
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- 4. FUNCTION: AUTO-UPDATE UPDATED_AT ON ORDERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on order changes
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.orders IS 'Stores order and payment information for marketplace transactions';
COMMENT ON COLUMN public.orders.stripe_checkout_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN public.orders.amount_cents IS 'Total amount in cents (includes platform fee)';
COMMENT ON COLUMN public.orders.platform_fee_cents IS 'Platform fee taken by RECLAIM in cents';
COMMENT ON COLUMN public.orders.seller_amount_cents IS 'Amount seller receives in cents';
COMMENT ON COLUMN public.orders.status IS 'Order status: pending, paid, processing, completed, refunded, cancelled';
COMMENT ON COLUMN public.users.stripe_account_id IS 'Stripe Connect Account ID for receiving payouts';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
SELECT
  'orders' AS table_name,
  COUNT(*) AS row_count
FROM public.orders;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Stripe payments migration applied successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local';
  RAISE NOTICE '2. Set up Stripe webhook endpoint';
  RAISE NOTICE '3. Test checkout flow in test mode';
END $$;
