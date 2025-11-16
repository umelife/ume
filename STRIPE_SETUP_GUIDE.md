# Stripe Payment Integration Guide

Complete guide to setting up Stripe payments in RECLAIM marketplace.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Fund Flow](#fund-flow)
3. [Database Setup](#database-setup)
4. [Stripe Account Setup](#stripe-account-setup)
5. [Environment Variables](#environment-variables)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Going Live](#going-live)
9. [API Reference](#api-reference)

---

## Overview

The RECLAIM marketplace uses **Stripe Checkout** for secure payment processing. This integration supports:

- ✅ Secure card payments
- ✅ Platform fee collection (10% default)
- ✅ Seller payouts
- ✅ Full refund capability
- ✅ Order tracking
- ✅ Webhook-based status updates

**Tech Stack:**
- Stripe Checkout Sessions (for payment UI)
- Stripe Webhooks (for real-time updates)
- Supabase (for order storage)
- Next.js 15 App Router (server & client components)

---

## Fund Flow

### Payment Flow (Buyer → Platform → Seller)

```
1. Buyer clicks "Buy Now" ($100 item)
   ↓
2. Frontend calls /api/stripe/create-checkout-session
   ↓
3. Server creates Checkout Session
   - Total: $100
   - Platform Fee: $10 (10%)
   - Seller Amount: $90
   ↓
4. Buyer redirected to Stripe Checkout
   ↓
5. Buyer enters payment info & completes
   ↓
6. Stripe charges buyer $100
   ↓
7. Webhook: checkout.session.completed
   - Updates order status to 'paid'
   ↓
8. Platform holds $100
   - $10 kept as platform fee
   - $90 available for seller payout
   ↓
9. Buyer redirected to /orders/success
```

### Refund Flow

```
1. Seller/Admin calls /api/stripe/refund
   ↓
2. Server creates Stripe refund
   ↓
3. Stripe refunds $100 to buyer
   ↓
4. Webhook: charge.refunded
   - Updates order status to 'refunded'
   ↓
5. Platform releases held funds
```

**Current Implementation:** Direct payments (platform holds funds)
**Future Enhancement:** Stripe Connect (automatic seller payouts)

---

## Database Setup

### 1. Apply Migration

Run the SQL migration to create the `orders` table and add Stripe fields to `users`:

**Option A: Supabase Dashboard**
```
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy content from: supabase/migrations/20250115210000_add_stripe_payments.sql
4. Click "Run"
5. Verify success message
```

**Option B: Supabase CLI**
```bash
supabase db push
```

### 2. Schema Overview

**orders table:**
```sql
- id (UUID, primary key)
- buyer_id (UUID, references users)
- seller_id (UUID, references users)
- listing_id (UUID, references listings)
- stripe_checkout_session_id (TEXT)
- stripe_payment_intent_id (TEXT)
- amount_cents (INTEGER) -- Total amount
- platform_fee_cents (INTEGER) -- Platform's cut
- seller_amount_cents (INTEGER) -- Seller receives
- status (TEXT) -- pending, paid, refunded, etc.
- created_at, updated_at (TIMESTAMPTZ)
```

**users table additions:**
```sql
- stripe_account_id (TEXT) -- For future Connect integration
- stripe_onboarding_completed (BOOLEAN)
```

---

## Stripe Account Setup

### 1. Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with your email
3. Verify your email address

### 2. Get API Keys

**Development (Test Mode):**
```
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" (pk_test_...)
3. Copy "Secret key" (sk_test_...) - Click "Reveal"
```

**Production (Live Mode):**
```
1. Toggle to "Live mode" in dashboard
2. Complete business verification
3. Go to: https://dashboard.stripe.com/apikeys
4. Copy live keys (pk_live_..., sk_live_...)
```

### 3. Test Cards

Use these in test mode:

| Card Number          | Description                    |
|---------------------|--------------------------------|
| 4242 4242 4242 4242 | Visa - Success                |
| 4000 0025 0000 3155 | Visa - Requires authentication|
| 4000 0000 0000 9995 | Visa - Declined               |

- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## Environment Variables

### 1. Copy Example File

```bash
cp .env.local.example .env.local
```

### 2. Fill in Values

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from webhook setup

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Security:**
- NEVER commit `.env.local` to git
- NEVER expose `STRIPE_SECRET_KEY` to client
- Only `NEXT_PUBLIC_*` vars are sent to browser

---

## Webhook Configuration

Webhooks notify your app of Stripe events (payment success, refunds, etc.).

### Local Development

Use **Stripe CLI** to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Output will show webhook secret:
# > Ready! Your webhook signing secret is whsec_... (^C to quit)

# Copy the whsec_... value to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Keep this terminal running while developing!**

### Production Deployment

1. **Deploy your app** to production (Vercel, etc.)

2. **Create webhook endpoint in Stripe:**
   ```
   Go to: https://dashboard.stripe.com/webhooks
   Click: "+ Add endpoint"
   Endpoint URL: https://yourdomain.com/api/stripe/webhook
   ```

3. **Select events to listen for:**
   - [x] `checkout.session.completed`
   - [x] `payment_intent.succeeded`
   - [x] `charge.refunded`

4. **Copy signing secret:**
   ```
   After creating endpoint, click on it
   Click "Signing secret" → "Reveal"
   Copy whsec_... value
   Add to production environment variables
   ```

---

## Testing

### End-to-End Payment Test

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe CLI (separate terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test the flow:**
   ```
   a) Navigate to: http://localhost:3000/marketplace
   b) Click on any listing
   c) Click "Buy Now" button
   d) You'll be redirected to Stripe Checkout
   e) Use test card: 4242 4242 4242 4242
   f) Complete payment
   g) You'll be redirected to success page
   h) Check Stripe CLI terminal - should see webhook events
   i) Verify order in Supabase: orders table → status = 'paid'
   ```

### Test Refunds

```bash
# Using curl
curl -X POST http://localhost:3000/api/stripe/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "orderId": "your-order-uuid",
    "reason": "requested_by_customer"
  }'

# Or use Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/payments
# Find payment → Click "Refund"
```

### Verify Database

Check Supabase orders table:

```sql
SELECT
  id,
  status,
  amount_cents / 100.0 AS amount_dollars,
  stripe_checkout_session_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

---

## Going Live

### Checklist

- [ ] Complete Stripe business verification
- [ ] Switch to live API keys in production
- [ ] Update webhook endpoint to production URL
- [ ] Test live payment with real card (small amount)
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Review Stripe Dashboard for disputes/chargebacks
- [ ] Set up email notifications for orders
- [ ] Consider PCI compliance requirements

### Production Environment Variables

```env
# Use LIVE keys (pk_live_..., sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From production webhook

NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## API Reference

### POST /api/stripe/create-checkout-session

Creates a Stripe Checkout Session for purchasing a listing.

**Request:**
```json
{
  "listingId": "uuid-here"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_...",
  "orderId": "uuid-here"
}
```

**Errors:**
- `400` - Missing listingId
- `401` - Not authenticated
- `404` - Listing not found
- `500` - Server error

---

### POST /api/stripe/webhook

Handles Stripe webhook events (called by Stripe, not your frontend).

**Events Handled:**
- `checkout.session.completed` → Updates order to 'paid'
- `payment_intent.succeeded` → Records payment intent
- `charge.refunded` → Updates order to 'refunded'

**Headers Required:**
- `stripe-signature` - Webhook signature for verification

---

### POST /api/stripe/refund

Issues a refund for an order.

**Request:**
```json
{
  "orderId": "uuid-here",
  "reason": "requested_by_customer"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "re_...",
    "amount": 10000,
    "status": "succeeded"
  },
  "order": { ... }
}
```

**Authorization:**
- Seller or buyer of the order
- TODO: Add admin role check

**Errors:**
- `400` - Invalid order status
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Order not found

---

## Troubleshooting

### Webhook Not Firing

**Check:**
1. Stripe CLI running? (`stripe listen ...`)
2. Correct endpoint URL?
3. Check Stripe Dashboard → Webhooks → Click endpoint → View logs
4. Verify `STRIPE_WEBHOOK_SECRET` matches

### Payment Succeeds but Order Not Updated

**Check:**
1. Webhook logs in Stripe Dashboard
2. Server logs for errors
3. Supabase logs (Dashboard → Logs)
4. Database permissions (RLS policies)

### "Invalid API Key" Error

**Check:**
1. Correct key for mode (test vs live)?
2. Key copied completely (no spaces)?
3. Key in correct env var (`STRIPE_SECRET_KEY`)?
4. Server restarted after adding env var?

---

## Support Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Support](https://support.stripe.com)
- [Supabase Docs](https://supabase.com/docs)

---

## Future Enhancements

1. **Stripe Connect**
   - Automatic seller payouts
   - Split payments at checkout
   - Individual seller dashboards

2. **Payment Methods**
   - Apple Pay / Google Pay
   - Bank transfers (ACH)
   - Buy Now Pay Later (Klarna, Afterpay)

3. **Subscriptions**
   - Premium seller accounts
   - Featured listings

4. **Dispute Handling**
   - Automated dispute workflow
   - Evidence collection

5. **Analytics**
   - Revenue dashboard
   - Payment success rates
   - Refund tracking

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Author:** RECLAIM Team
