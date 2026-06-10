# UME — Summer → Fall Growth Playbook

**Campus:** University of the Cumberlands
**Author:** founding team
**Written:** 2026-05-29 · **Updated:** 2026-06-01
**Goal:** Turn a stalled, post-move-out marketplace into a daily-habit campus app, launched hard at fall move-in — with zero institutional support, grassroots only.

> ⚠️ **Verify the dates.** Move-in week below is estimated (~Aug 17–23, 2026). Check the actual University of the Cumberlands fall calendar and shift every date to match. The *sequence* matters more than the exact days.

---

## The thesis (one paragraph)

We don't have a product problem — we have a timing and habit problem. Supply peaked at **move-out (May)**, demand peaks at **move-in (August)**, and a pure marketplace gives nobody a reason to open the app in between. So: (1) the **feed** is the daily hook that keeps people warm through the gap, (2) the **marketplace** cashes in when demand lands in August, (3) the **incoming freshman class (2029)** is the demand beachhead we seed online over the summer, (4) **returning upperclassmen** are the supply we stage for an August relist push, and (5) the **referral loop** is our only growth engine because we have no paid and no official channel.

## ✅ Build status — shipped (updated 2026-06-01)

The product foundation is done and live. What changed this build:

- **Scope tightened to Marketplace + Communities.** Cut Services and the entire Events feature (both were empty / "coming soon"). The app is now honest — no coming-soon lies anywhere. Events code is preserved in git to revive later *if* students actually host them.
- **Student-only.** Signup is `.edu` students only (account-type chooser removed). The fake "Simulate Verification" screen is gone — a confirmed `.edu` email *is* the verification. SheerID stays dormant (flip on with one env var).
- **Communities seeded.** 6 starter Cumberlands communities (UC Campus Hub, Free & For Sale, Textbook Exchange, Housing & Roommates, Class of 2029, Patriots Gaming) so the tab isn't empty. ⚠️ *You still owe real posts in them before school.*
- **Marketplace ↔ Community bridge.** "Share to a community" posts a listing into a community as a link back to it.
- **Referral loop v1.** Share button on listings + Invite button on profiles, both bake in `?ref=<handle>`; signups attributed into a `referrals` table; profile shows an "invited" count. **No rewards yet — measure first.**
- **Clean handles + trust.** Random friendly handles (e.g. `HungryHippo482`) instead of email-derived ones; "verified student" badge on profiles + listings.
- **Analytics.** PostHog wired (events + pageviews + session replay) alongside Mixpanel; `signup_start` added for a clean funnel.

**Still open:** real community posts (you); confirm PostHog env vars; referral rewards (v2); a custom story share-image (v2). The bigger **feed-as-home** restructure is still a *decision, not done* — Communities is a browsable list, not one auto-joined campus feed.

---

## The two populations (don't confuse them)

| | **Demand side** | **Supply side** |
|---|---|---|
| Who | Incoming freshmen (Class of 2029) | Returning upperclassmen, grad students, off-campus students |
| Need | Empty dorm, need everything, no friends yet | Stuff to offload, want quick local sales |
| Where to reach now | 2029 Snapchat group, admitted-students IG, roommate groups | Existing 100 users, campus FB "free & for sale" group, GroupMe |
| Peak moment | Move-in (August) | Move-out (May, past) → re-list (August) |
| Pitch | "Find your people + everything for your dorm, all verified students" | "Sell your stuff to incoming freshmen — safe, on-campus, .edu-only" |

---

## Phase 0 — Foundation (DONE ✅)

Direction locked and the lies cleared.

- [x] Direction: **Marketplace + Communities**, student-only, no "coming soon."
- [x] Killed every "coming soon" string: cut Services, surfaced Communities as real, removed the chat/PostComposer "coming soon" affordances. (Events later cut entirely.)
- [x] Got into the **2029 Snapchat group** (in progress when written; demand-seeding channel).
- [ ] Identify the campus **FB "free & for sale" group** and/or **GroupMe** — confirm it exists, join, observe who posts most. *(still open — richest supply vein)*

## Phase 1 — Build the hook + the engine (June)

This is heads-down month. Campus is empty; **do not judge traction**.

- [ ] **Feed-as-home (still a DECISION, not done):** Communities is a browsable list today, not one auto-joined campus feed. Revisit only if engagement says the discover-and-join step is real friction.
- [x] **Seeded 6 communities** (UC Campus Hub, Free & For Sale, Textbooks, Housing, Class of 2029, Patriots Gaming). ⚠️ *Owe: real posts in them before school.*
- [x] **Marketplace ↔ Community bridge:** "Share to a community" posts a listing into a community.
- [x] **Referral loop v1 — built.** Share button (native share sheet) + Invite button, both with `?ref=<handle>`; attribution into a `referrals` table; "invited" count on profiles.
  - [x] Invite link per user (the code is their username)
  - [ ] Story-optimized branded share *image* — v1 uses the listing's OG preview; a custom vertical card is a v2 upgrade
  - [ ] Reward fuel (boost / badge / leaderboard) — deliberately deferred until shares prove out
- [ ] **Concierge listing** path: "text us a photo + price, we'll post it" — even if it's just a DM to founders for now.
- [ ] Make posting flawless on a real phone. Time the post-a-listing flow; cut steps.

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
- [ ] **Seed real posts** into the 6 communities (free stuff, welcome posts) before school
- [ ] Confirm PostHog env vars in Vercel (`NEXT_PUBLIC_POSTHOG_KEY`, and `NEXT_PUBLIC_POSTHOG_HOST` if EU); enable Session Replay in the PostHog dashboard
- [ ] Decide on referral **rewards (v2)** once v1 shares show real conversion in PostHog
