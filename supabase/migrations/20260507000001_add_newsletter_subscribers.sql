CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  source         TEXT NOT NULL DEFAULT 'homepage',
  subscribed_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ns_email_idx ON public.newsletter_subscribers(email);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Only service role can access — no user-level policies needed
