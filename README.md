# UME — Campus Marketplace

**A verified student-only marketplace and community platform for university campuses.**

100+ active users · Live at [ume-life.com](https://ume-life.com)

Students buy, sell, connect, and meet safely — all verified via `.edu` email.

---

## What it does

### Marketplace
- `.edu` email-only authentication — no outsiders
- Create and browse listings with up to 10 images
- Search, filter by category, condition, price, and campus
- Real-time chat between buyers and sellers (typing indicators, read receipts, edit/delete)
- Save listings to a liked list (synced to DB for logged-in users)

### Safe-Handshake
- GPS-verified campus meetup system (25m geofence around Blue Light stations)
- 5-step flow: Intent → Heading → Arrived → QR scan → Done
- One-time cryptographic QR code (5-min expiry, single-use)
- Stripe escrow: card authorized at checkout, charged only on QR scan
- 4-hour auto-cancel voids authorization if meetup doesn't happen

### Payments & Shipping
- Stripe Connect V2 — sellers onboard via Express accounts
- In-person payments with escrow (capture on QR scan)
- EasyPost shipping — real USPS/UPS/FedEx rate shopping and label generation
- Buyer protection: refund available if no tracking after 3 days
- Admin refund override panel

### Communities
- Student-run groups for any interest (study groups, clubs, Greek life, gaming, sports)
- Posts with upvotes and threaded comments
- Community moderation (owner/moderator roles, kick members, community rules)
- Private communities support

### Events
- Campus event discovery with state/search filters
- RSVP (going / interested) with attendee count
- Event creation restricted to community owners/moderators
- Creator can cancel events

### SEO & Discovery
- 70 campus landing pages at `/campus/[slug]` targeting "[university] student marketplace" searches
- Full sitemap with all campus, community, and listing pages
- Two-area architecture: public content pages (indexed) + private app (auth-gated)
- FAQ and reviews sections on homepage

### Admin
- Moderation panel: view/resolve/dismiss reports
- Orders & refunds panel: issue Stripe refunds directly from admin
- CSV export of reports
- Analytics dashboard

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (.edu domain gate) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime (chat, typing indicators, Safe-Handshake) |
| Payments | Stripe Connect V2 (destination charges, escrow) |
| Shipping | EasyPost (USPS / UPS / FedEx rates + label generation) |
| Email | Brevo (transactional + message notifications) |
| Push | Web Push API |
| Analytics | Mixpanel |
| Deployment | Vercel (ISR + image optimization) |
| Testing | Playwright E2E |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/umelife/ume.git
cd ume
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Required:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_APP_URL=https://ume-life.com

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

EASYPOST_API_KEY=your_key

BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=no-reply@ume-life.com

NEXT_PUBLIC_MIXPANEL_TOKEN=your_token

ADMIN_EMAILS=your@email.edu
```

### 3. Database migrations

In your Supabase SQL Editor, run each file in `supabase/migrations/` in filename order.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Testing

```bash
# Install Playwright browsers (first time)
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Auth protection tests
npm run test:auth

# Smoke tests
npm run test:smoke
```

---

## Deployment

Push to `main` — Vercel auto-deploys. Add all env vars in Vercel Dashboard → Settings → Environment Variables.

---

## Enabling payments

Stripe Connect is fully integrated. To go live:

1. Complete Stripe KYC and switch to live keys in Vercel env vars
2. Add production webhook endpoint: `https://ume-life.com/api/stripe/webhook`
3. Add V2 webhook endpoint: `https://ume-life.com/api/stripe/webhook/v2`

---

## Scripts

```bash
npm run dev           # Local dev server
npm run build         # Production build
npm run lint          # ESLint
npm run test:e2e      # Playwright E2E suite
npm run test:auth     # Auth protection checks
npm run test:smoke    # Smoke tests
```

---

Built for university students, by a university student.
