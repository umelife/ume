-- ============================================================================
-- Seed: University of the Cumberlands starter communities + welcome events
-- ----------------------------------------------------------------------------
-- Purpose: so the Communities and Events tabs are not empty for the first
-- students who arrive. Owned by the official `umelife` account.
--
-- Safe to re-run: every insert is guarded with WHERE NOT EXISTS on a natural
-- key (community slug / event title+community), so running twice is a no-op.
-- ============================================================================

-- 1) Communities ------------------------------------------------------------
insert into communities (creator_id, name, slug, description, category, city, state, campus, member_count, status)
select o.id, c.name, c.slug, c.description, c.category, 'Williamsburg', 'KY', 'uc_cumberlands', 1, 'active'
from (select id from users where username = 'umelife' limit 1) o,
(values
  ('UC Campus Hub',        'uc-campus-hub',           'The main hangout for University of the Cumberlands students. Ask questions, share what is happening, and meet your fellow Patriots.', 'social'),
  ('Free & For Sale',      'uc-free-and-for-sale',    'Cumberlands students giving away and selling stuff — move-out finds, dorm gear, and free piles. Grab it before it is gone.',            'other'),
  ('Textbook Exchange',    'uc-textbook-exchange',    'Buy, sell, and swap textbooks with other UC students. Skip the bookstore markup.',                                                    'study'),
  ('Housing & Roommates',  'uc-housing-and-roommates','Find roommates, sublets, and off-campus housing near University of the Cumberlands.',                                                 'social'),
  ('Class of 2029',        'uc-class-of-2029',        'Incoming Cumberlands freshmen — meet your classmates before move-in. Roommate searches, questions, and hype.',                         'social'),
  ('Patriots Gaming',      'uc-patriots-gaming',      'Find your squad. Valorant, COD, Smash, and board games for UC students who game.',                                                    'gaming')
) as c(name, slug, description, category)
where not exists (select 1 from communities x where x.slug = c.slug);

-- 2) Owner memberships ------------------------------------------------------
insert into community_members (community_id, user_id, role)
select c.id, c.creator_id, 'owner'
from communities c
where c.slug in (
  'uc-campus-hub','uc-free-and-for-sale','uc-textbook-exchange',
  'uc-housing-and-roommates','uc-class-of-2029','uc-patriots-gaming'
)
and c.creator_id is not null
and not exists (
  select 1 from community_members m
  where m.community_id = c.id and m.user_id = c.creator_id
);

-- 3) Sync member_count to actual memberships -------------------------------
-- (a DB trigger increments member_count on membership insert, so re-derive it
-- from the source of truth to avoid double-counting.)
update communities c
set member_count = (select count(*) from community_members m where m.community_id = c.id)
where c.slug in (
  'uc-campus-hub','uc-free-and-for-sale','uc-textbook-exchange',
  'uc-housing-and-roommates','uc-class-of-2029','uc-patriots-gaming'
);
