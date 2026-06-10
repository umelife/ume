-- ============================================================================
-- Referrals — who invited whom
-- ----------------------------------------------------------------------------
-- A user's referral code is their username. When someone lands via a coded
-- link (?ref=<username>) and then signs up, the signup API records a row here
-- (via the service client). Each referred user can only be attributed once.
-- ============================================================================

create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.users(id) on delete cascade,
  referred_id  uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

alter table public.referrals enable row level security;

-- Counts are not sensitive — allow reads so we can show "invited N friends".
-- Inserts happen only via the service client in the signup API (no insert
-- policy = blocked for normal clients).
drop policy if exists referrals_select_all on public.referrals;
create policy referrals_select_all on public.referrals for select using (true);
