-- ─────────────────────────────────────────────────────────────────────────────
-- UME Communities + Events (Phase 1)
-- Tables: communities, community_members, community_posts, post_votes,
--         post_comments, events, event_rsvps
-- Also extends: users (account_type, org_name, city, state, subscription fields)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Extend users ─────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'student'
    CHECK (account_type IN ('student','organization','personal')),
  ADD COLUMN IF NOT EXISTS org_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none','active','past_due','cancelled')),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2) communities ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  city TEXT,
  state TEXT,
  campus TEXT,  -- optional campus tag (from CAMPUSES.id in data/safe-points.ts)
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS communities_category_idx ON public.communities(category, status);
CREATE INDEX IF NOT EXISTS communities_campus_idx ON public.communities(campus) WHERE campus IS NOT NULL;
CREATE INDEX IF NOT EXISTS communities_state_idx ON public.communities(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS communities_creator_idx ON public.communities(creator_id);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communities_select_active" ON public.communities;
CREATE POLICY "communities_select_active" ON public.communities
  FOR SELECT USING (status = 'active' OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "communities_insert_auth" ON public.communities;
CREATE POLICY "communities_insert_auth" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "communities_update_creator" ON public.communities;
CREATE POLICY "communities_update_creator" ON public.communities
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "communities_delete_creator" ON public.communities;
CREATE POLICY "communities_delete_creator" ON public.communities
  FOR DELETE USING (auth.uid() = creator_id);

-- 3) community_members ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS cm_user_idx ON public.community_members(user_id);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_select_all" ON public.community_members;
CREATE POLICY "cm_select_all" ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "cm_insert_self" ON public.community_members;
CREATE POLICY "cm_insert_self" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cm_delete_self" ON public.community_members;
CREATE POLICY "cm_delete_self" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- member_count triggers
CREATE OR REPLACE FUNCTION public.inc_member_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.dec_member_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS cm_inc ON public.community_members;
CREATE TRIGGER cm_inc AFTER INSERT ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.inc_member_count();

DROP TRIGGER IF EXISTS cm_dec ON public.community_members;
CREATE TRIGGER cm_dec AFTER DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.dec_member_count();

-- 4) community_posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','link')),
  title TEXT NOT NULL,
  body TEXT,
  image_urls TEXT[] DEFAULT '{}',
  link_url TEXT,
  upvote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS cp_community_idx ON public.community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cp_author_idx ON public.community_posts(author_id);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select_all" ON public.community_posts;
CREATE POLICY "cp_select_all" ON public.community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "cp_insert_member" ON public.community_posts;
CREATE POLICY "cp_insert_member" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "cp_delete_author" ON public.community_posts;
CREATE POLICY "cp_delete_author" ON public.community_posts
  FOR DELETE USING (auth.uid() = author_id);

-- 5) post_votes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_votes (
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pv_select_all" ON public.post_votes;
CREATE POLICY "pv_select_all" ON public.post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "pv_insert_self" ON public.post_votes;
CREATE POLICY "pv_insert_self" ON public.post_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pv_delete_self" ON public.post_votes;
CREATE POLICY "pv_delete_self" ON public.post_votes
  FOR DELETE USING (auth.uid() = user_id);

-- upvote_count triggers
CREATE OR REPLACE FUNCTION public.inc_upvote_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.community_posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.dec_upvote_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.community_posts SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS pv_inc ON public.post_votes;
CREATE TRIGGER pv_inc AFTER INSERT ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.inc_upvote_count();

DROP TRIGGER IF EXISTS pv_dec ON public.post_votes;
CREATE TRIGGER pv_dec AFTER DELETE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.dec_upvote_count();

-- 6) post_comments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS pc_post_idx ON public.post_comments(post_id, created_at ASC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pc_select_all" ON public.post_comments;
CREATE POLICY "pc_select_all" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "pc_insert_auth" ON public.post_comments;
CREATE POLICY "pc_insert_auth" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "pc_delete_author" ON public.post_comments;
CREATE POLICY "pc_delete_author" ON public.post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- comment_count triggers
CREATE OR REPLACE FUNCTION public.inc_comment_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.dec_comment_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.community_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS pc_inc ON public.post_comments;
CREATE TRIGGER pc_inc AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.inc_comment_count();

DROP TRIGGER IF EXISTS pc_dec ON public.post_comments;
CREATE TRIGGER pc_dec AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.dec_comment_count();

-- 7) events ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location_type TEXT NOT NULL DEFAULT 'in_person'
    CHECK (location_type IN ('in_person','virtual','hybrid')),
  location_address TEXT,
  city TEXT,
  state TEXT,
  max_attendees INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','cancelled','completed')),
  stripe_payment_intent_id TEXT,
  is_promoted BOOLEAN DEFAULT false,
  promoted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS events_community_idx ON public.events(community_id, starts_at ASC);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON public.events(starts_at ASC) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS events_state_idx ON public.events(state, starts_at ASC) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_creator_idx ON public.events(creator_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all" ON public.events;
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_creator" ON public.events;
CREATE POLICY "events_insert_creator" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "events_update_creator" ON public.events;
CREATE POLICY "events_update_creator" ON public.events
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "events_delete_creator" ON public.events;
CREATE POLICY "events_delete_creator" ON public.events
  FOR DELETE USING (auth.uid() = creator_id);

-- 8) event_rsvps ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','interested')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS er_user_idx ON public.event_rsvps(user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "er_select_all" ON public.event_rsvps;
CREATE POLICY "er_select_all" ON public.event_rsvps FOR SELECT USING (true);

DROP POLICY IF EXISTS "er_insert_self" ON public.event_rsvps;
CREATE POLICY "er_insert_self" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "er_update_self" ON public.event_rsvps;
CREATE POLICY "er_update_self" ON public.event_rsvps
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "er_delete_self" ON public.event_rsvps;
CREATE POLICY "er_delete_self" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- rsvp_count triggers
CREATE OR REPLACE FUNCTION public.inc_rsvp_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.dec_rsvp_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS er_inc ON public.event_rsvps;
CREATE TRIGGER er_inc AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.inc_rsvp_count();

DROP TRIGGER IF EXISTS er_dec ON public.event_rsvps;
CREATE TRIGGER er_dec AFTER DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.dec_rsvp_count();
