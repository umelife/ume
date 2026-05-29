# UME — Summer → Fall Growth Playbook

**Campus:** University of the Cumberlands
**Author:** founding team
**Written:** 2026-05-29
**Goal:** Turn a stalled, post-move-out marketplace into a daily-habit campus app, launched hard at fall move-in — with zero institutional support, grassroots only.

> ⚠️ **Verify the dates.** Move-in week below is estimated (~Aug 17–23, 2026). Check the actual University of the Cumberlands fall calendar and shift every date to match. The *sequence* matters more than the exact days.

---

## The thesis (one paragraph)

We don't have a product problem — we have a timing and habit problem. Supply peaked at **move-out (May)**, demand peaks at **move-in (August)**, and a pure marketplace gives nobody a reason to open the app in between. So: (1) the **feed** is the daily hook that keeps people warm through the gap, (2) the **marketplace** cashes in when demand lands in August, (3) the **incoming freshman class (2029)** is the demand beachhead we seed online over the summer, (4) **returning upperclassmen** are the supply we stage for an August relist push, and (5) the **referral loop** is our only growth engine because we have no paid and no official channel.

## The two populations (don't confuse them)

| | **Demand side** | **Supply side** |
|---|---|---|
| Who | Incoming freshmen (Class of 2029) | Returning upperclassmen, grad students, off-campus students |
| Need | Empty dorm, need everything, no friends yet | Stuff to offload, want quick local sales |
| Where to reach now | 2029 Snapchat group, admitted-students IG, roommate groups | Existing 100 users, campus FB "free & for sale" group, GroupMe |
| Peak moment | Move-in (August) | Move-out (May, past) → re-list (August) |
| Pitch | "Find your people + everything for your dorm, all verified students" | "Sell your stuff to incoming freshmen — safe, on-campus, .edu-only" |

---

## Phase 0 — Foundation (now → ~June 7)

Lock the direction and clear the lies before building.

- [ ] Confirm direction: **combined feed + marketplace**, feed-as-home, no "coming soon."
- [ ] Audit + kill every "coming soon" string (list already mapped):
  - [ ] `app/services/page.tsx` — cut Services entirely for now
  - [ ] `app/page.tsx` + `components/MobileHome.tsx` — turn Communities/Events from "coming soon" cards into real live sections
  - [ ] `components/MobileTabBar.tsx` — remove coming-soon dots/labels
  - [ ] `components/communities/PostComposer.tsx` — fix image upload (don't ship a feed without images)
  - [ ] `app/messages/page.tsx:908` — remove the "Image sharing is coming soon" alert or hide the button
  - [ ] `app/payments-coming-soon` + payment routes — fine to leave hidden (not daily-facing)
- [ ] Get into the **2029 Snapchat group** (in progress). Goal: a seat, not a sale, yet.
- [ ] Identify the campus **FB "free & for sale" group** and/or **GroupMe** — confirm it exists, join, observe who posts most.

## Phase 1 — Build the hook + the engine (June)

This is heads-down month. Campus is empty; **do not judge traction**.

- [ ] **Feed-as-home:** every verified student auto-joined to one campus-wide feed. No "discover & join" required.
- [ ] **Seed 5–6 channels** so it's never blank: `Free & Giveaways`, `Housing & Sublets`, `Textbooks`, `Ride Share`, `Lost & Found`, `What's Happening`.
- [ ] **Marketplace becomes a tab** inside the feed, not the whole app.
- [ ] **Referral loop — build it in** (this is the only growth engine, treat it as core, not nice-to-have):
  - [ ] Invite link per user
  - [ ] Shareable listing/feed cards designed for an Instagram **story** (vertical, branded, QR/link)
  - [ ] A simple reward (referral count leaderboard, or invite-to-unlock something)
- [ ] **Concierge listing** path: "text us a photo + price, we'll post it" — even if it's just a DM to founders for now.
- [ ] Make posting flawless on a real phone (images included). Time the post-a-listing flow; cut steps.

## Phase 2 — Demand seeding + supply prep (July)

- [ ] **2029 group → be the helpful peer, not a spammer.** Answer move-in questions, share free finds, post genuinely useful stuff. Earn the right to mention UME.
- [ ] Soft-introduce UME to 2029 as "the verified-student app where you'll find everything for your dorm + meet people before you get here." Let curiosity pull, don't push.
- [ ] Get a handful of **incoming freshmen onto the feed early** — the "what's happening / ask anything" channel works even with zero marketplace activity.
- [ ] **Line up supply, don't burn it yet.** Build a list of the original 100 posters + the most active sellers in the campus FB/GroupMe. This is your August relist army.
- [ ] **Free & Giveaways:** start filling it with anything free floating around over summer — keeps the feed visibly alive.
- [ ] Line up 2–3 **student-run meme/confession IG accounts** for a move-in-week shoutout (trade or cheap — they're students, not the school).

## Phase 3 — Supply relist push (early–mid August, ~Aug 3–16)

The freshmen are about to arrive. Stock the shelves *before* they do.

- [ ] **Re-activate the original 100 + your seller list:** "Freshmen are moving in — relist your stuff now, it'll actually sell this time." This is the highest-ROI message you'll send all year.
- [ ] Concierge-list for anyone who's lazy: collect photos, post for them.
- [ ] Pull active sellers from the campus FB/GroupMe with the `.edu`-verified + safe-meetup angle.
- [ ] Target dorm-relevant inventory specifically: fridges, futons, lamps, fans, desks, textbooks, kitchenware.
- [ ] **Goal: the marketplace looks *full* on the day freshmen first open it.** Empty shelves on day one kills the launch.

## Phase 4 — Move-in launch (move-in week, ~Aug 17–23)

This is the **real launch.** Not "it's live" — a campaign. Peer-to-peer, no institution.

- [ ] **Physical, no-permission presence:** students handing students flyers/QR codes in public spaces; flyers at coffee shops, laundromats, off-campus apartments, bus stops.
- [ ] **Meme/confession IG shoutouts go live** this week.
- [ ] **Drop into every group chat you can reach** (2029 Snap, dorm GroupMes, club/Greek/team chats) with a real free listing or a genuinely useful post — not an ad.
- [ ] Push the **referral loop hard:** every active user is asked to invite their hall / their friends. Make sharing a feed/listing card one tap.
- [ ] Founders are *in the feed daily* — answering, posting free stuff, welcoming freshmen. Be the energy until it self-sustains.

## Phase 5 — Sustain + honest checkpoint (September)

- [ ] Keep the feed warm daily: free stuff, "what's happening," welcome posts.
- [ ] Watch for the flywheel: freshmen buying → upperclassmen seeing sales → posting more → more buyers.
- [ ] **End-of-September checkpoint (the only one that matters):**

### The metric that decides everything

Not signups. **Weekly active / returning users** and **D7 retention.**

- **Continue signal:** a meaningful share of returning students open the app **weekly**, unprompted, and the feed produces daily posts without you manually filling it.
- **Rethink signal:** even with a seeded feed + full marketplace + a fresh class, you can't get weekly opens. If the hook can't hold ~100–300 people on one campus, more features won't fix it — the thesis needs to change.
- Earn the right to expand (Events, Services, payments, a 2nd campus) **only after** the hook holds.

---

## Channels cheat sheet (all grassroots, zero permission needed)

- 2029 Snapchat group (demand seeding) — *in progress*
- Admitted-students / Class-of-2029 Instagram + roommate-finder groups
- Dorm, Greek, club, and sports-team GroupMe / group chats
- Student-run meme & confession Instagram accounts (shoutouts/trades)
- Campus FB "free & for sale" group + GroupMe (supply recruiting)
- Flyers + QR in school-uncontrolled spaces: cafés, laundromats, off-campus housing, bus stops
- Students handing students flyers in public — no approval required

## What NOT to do

- ❌ Don't wait on the school. They won't help; you don't need them. Every campus app that mattered grew underneath the institution, not through it.
- ❌ Don't market in June/July to the whole campus — they're home. Seed the *freshman* class online; save the energy for move-in.
- ❌ Don't try to pull sellers out of the freshman group — they're buyers.
- ❌ Don't perfect payments/shipping/escrow further. It's done. It's not the bottleneck.
- ❌ Don't judge traction before September.
- ❌ Don't ship a feed without working image upload, or a homepage that says "coming soon" about things you already built.

---

## Open items to confirm

- [ ] Actual Cumberlands fall move-in date → reset all dates above
- [ ] Does a campus FB "free & for sale" group / GroupMe exist? (richest supply vein)
- [ ] Who owns the referral-loop build? (it's the engine — it can't slip)
