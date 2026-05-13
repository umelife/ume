-- Saved listings (heart/bookmark on marketplace cards)
CREATE TABLE IF NOT EXISTS public.saved_listings (
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS sl_user_idx ON public.saved_listings(user_id);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sl_select_own" ON public.saved_listings;
CREATE POLICY "sl_select_own" ON public.saved_listings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sl_insert_own" ON public.saved_listings;
CREATE POLICY "sl_insert_own" ON public.saved_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sl_delete_own" ON public.saved_listings;
CREATE POLICY "sl_delete_own" ON public.saved_listings
  FOR DELETE USING (auth.uid() = user_id);
