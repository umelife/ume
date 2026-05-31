# Claude Code Session — UME Platform Development
**Submitted for Y Combinator Summer 2026 — AI Coding Tools Question**

This is a representative session from building UME (ume-life.com), a verified campus marketplace and community platform for college students. The session demonstrates how I use Claude Code as a primary engineering collaborator to ship full-stack features rapidly.

---

## Session Summary

In this single session, we shipped the following across the UME codebase:

### Features Built

**1. Communities + Events — Full Feature (Phase 1)**
- 2 Supabase DB migrations (communities, community_members, community_posts, post_votes, post_comments, events, event_rsvps — with RLS policies, triggers for member/vote/comment counts, and indexes)
- 8 new pages: `/communities`, `/communities/[slug]`, `/communities/[slug]/settings`, `/communities/create`, `/communities/[slug]/posts/[id]`, `/communities/[slug]/events`, `/events`, `/events/[id]`, `/events/create`
- 12+ components: `CommunityCard`, `PostCard`, `PostComposer`, `CommunityJoinButton`, `StateFilter`, `EventCard`, `EventRsvpButtons`, `CancelEventButton`, `PostVoteButton`, `CommentComposer`, `CommentsSection` (with threaded replies)
- Server actions: `createCommunity`, `joinCommunity`, `leaveCommunity`, `createPost`, `votePost`, `createComment`, `deletePost`, `updateRules`, `kickMember`, `promoteMember`, `deleteCommunity`

**2. Mobile Tab Bar — Communities Discovery**
- Added Communities as 6th tab with people icon
- Reduced icon size from w-12 to w-10 to fit 6 tabs without overflow
- Tab highlights on both `/communities` and `/events` routes

**3. Comment Reply Threading**
- Built `CommentsSection` client component with inline reply composer per comment
- Uses `parent_id` on `post_comments` table (already in schema)
- State: which comment has reply box open, optimistic UI, `router.refresh()` on submit

**4. DB-Backed Favorites (Heart Button)**
- Migration: `saved_listings` table with RLS
- Server actions: `saveListing`, `unsaveListing`, `getSavedListingIds`
- Updated `useCart` hook: on init, merges DB saved IDs into localStorage; on heart tap, fire-and-forgets to DB while keeping localStorage as source of truth for UI responsiveness
- Falls back to localStorage silently when not logged in

**5. Newsletter Signup — Real Backend**
- Migration: `newsletter_subscribers` table (email unique, source, subscribed_at)
- API route: `POST /api/newsletter` — validates, upserts (re-subscribe doesn't error)
- Replaced fake `setTimeout` success in `NewsletterSignup.tsx` with real fetch

**6. Admin Refund Panel**
- Added Orders & Refunds section to `/admin` page
- `OrderRefundCard` client component: shows buyer name, email, listing title, amount, status badge
- "Issue Refund" button calls existing `/api/stripe/refund` endpoint
- Fetches last 30 paid/refunded orders using service role client

**7. Marketing Materials**
- Re-engagement email HTML template (Brevo-ready) with summer hook, Communities/Events announcement, and referral ask
- Marketing poster PNG (1080×1350) built with Python/Pillow using ArchivoBlack + WorkSans fonts matching UME brand (indigo #130170, pink #FF2D6B, cream #FFF8F0)

---

## How I Direct Claude Code

A few examples from this session of how I guide the process rather than just accept output:

**Catching existing functionality:**
When Claude suggested building a favorites/bookmark feature, I pointed out the heart button already existed in the marketplace. Claude then inspected `useCart`, found it was localStorage-only, and we scoped the task correctly to DB sync rather than building from scratch.

**Redirecting scope:**
Claude flagged 5 UX improvements. I questioned whether #5 (bookmarks) was needed given the heart button. Claude confirmed the upvote serves the same purpose for community posts, and we narrowed scope to the 3 that actually mattered.

**Verifying before declaring done:**
After each batch of changes, we ran `npx tsc --noEmit` to confirm zero type errors before moving on. This caught issues early rather than at deploy time.

**Architecture decisions:**
For the DB-backed favorites, I chose to keep localStorage as the primary source of truth for UI responsiveness and use DB as a sync layer (fire-and-forget), rather than making the DB the source of truth and adding loading states everywhere. Claude implemented accordingly.

---

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript** throughout
- **Supabase** (PostgreSQL, RLS, Realtime, Auth, Storage)
- **Tailwind CSS** + shadcn/ui
- **Stripe Connect V2** (payments + escrow)
- **EasyPost** (shipping)
- **Brevo** (transactional + campaign email)
- **Mixpanel** (analytics)
- **Vercel** (deployment with ISR)
- **Claude Code** — primary development tool for this entire build

---

## Platform Status at Session End

- Live at ume-life.com
- 100 verified .edu users, 27 MAU
- Zero TypeScript errors across entire codebase
- Communities + Events fully functional pending 2 Supabase migrations
