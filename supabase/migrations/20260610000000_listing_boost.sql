-- ============================================================================
-- Referral reward: listing boost
-- ----------------------------------------------------------------------------
-- Each successful referral features the referrer's listings for a few more
-- days. `boosted_until` is a timestamp on the user; while it's in the future,
-- their active listings sort first and show a "Featured" badge.
-- ============================================================================

alter table public.users add column if not exists boosted_until timestamptz;

create index if not exists users_boosted_until_idx on public.users (boosted_until);
