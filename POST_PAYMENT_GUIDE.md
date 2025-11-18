# 📧 Post-Payment Confirmation & Notification System

Complete guide for the automated post-payment notification system in Reclaim marketplace.

---

## 🎯 Overview

When a buyer successfully completes payment, the following happens automatically:

1. **Stripe webhook** confirms the payment
2. **Order status** updates to "paid" in database
3. **Buyer receives:**
   - ✅ Confirmation email with order details
   - ✅ In-app notification
   - ✅ Redirect to success page
4. **Seller receives:**
   - ✅ Sale notification email with shipping instructions
   - ✅ In-app notification
   - ✅ Buyer's shipping address (if provided)

---

## 📁 Files Created/Modified

### New Files Created:
1. `supabase/migrations/20250116000001_add_notifications_and_tracking.sql` - Database schema
2. `lib/email/sendEmail.ts` - Email service with templates
3. `lib/notifications/createNotification.ts` - In-app notification helpers
4. `POST_PAYMENT_GUIDE.md` - This file
5. `STRIPE_WEBHOOK_TEST.md` - Testing guide

### Modified Files:
1. `app/api/stripe/webhook/route.ts` - Enhanced with email/notification sending
2. `.env.local.example` - Added Resend API key
3. `package.json` - Added `resend` package

---

## 🗄️ Database Changes

### New `notifications` Table:
```sql
notifications (
  id uuid PRIMARY KEY,
  user_id uuid → users.id,
  type text, -- 'payment_success', 'order_shipped', 'item_sold'
  title text,
  message text,
  link text, -- Optional URL
  order_id uuid,
  listing_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz,
  read_at timestamptz
)
```

### Enhanced `orders` Table:
```sql
-- New columns added:
tracking_number text,
shipping_carrier text,
shipped_at timestamptz,
delivered_at timestamptz,
buyer_shipping_address jsonb
```

---

## ⚙️ Setup Instructions

### 1. Apply Database Migration

**Option A: Supabase Dashboard**
```bash
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# Run: supabase/migrations/20250116000001_add_notifications_and_tracking.sql
```

**Option B: Supabase CLI**
```bash
npx supabase db push
```

### 2. Set Up Resend (Email Service)

1. **Sign up at [Resend.com](https://resend.com)**
2. **Get API Key:**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_...`)
3. **Add to `.env.local`:**
   ```bash
   RESEND_API_KEY=re_your_key_here
   ```
4. **(Optional) Verify Domain:**
   - For production, add your domain in Resend dashboard
   - For development, emails work without domain verification

**Free Tier Limits:**
- 100 emails/day
- 3,000 emails/month
- Perfect for development and small-scale production

### 3. Configure Stripe Webhook

1. **Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)**

2. **Add Endpoint:**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing: Use Stripe CLI (see below)

3. **Select Events:**
   - `checkout.session.completed` ✅
   - `payment_intent.succeeded` ✅
   - `charge.refunded` ✅

4. **Copy Webhook Secret:**
   - Copy the `whsec_...` key
   - Add to `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
     ```

### 4. Install Dependencies

```bash
npm install resend
```

---

## 🧪 Testing Locally

### Method 1: Stripe CLI (Recommended)

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe

   # Mac (using Homebrew)
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Localhost:**
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

4. **Copy Webhook Secret from Output:**
   ```
   > Ready! Your webhook signing secret is whsec_...
   ```
   Add this to `.env.local` as `STRIPE_WEBHOOK_SECRET`

5. **Trigger Test Events:**
   ```bash
   # Trigger checkout.session.completed
   stripe trigger checkout.session.completed

   # Trigger payment_intent.succeeded
   stripe trigger payment_intent.succeeded
   ```

### Method 2: Manual Testing with Real Checkout

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Create Test Purchase:**
   - Sign in with test .edu email
   - Go to any listing (not your own)
   - Click "Buy Now"

3. **Use Test Card:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```

4. **Complete Checkout**

5. **Check Results:**
   - ✅ Redirected to `/orders/success?session_id=...`
   - ✅ Order status = "paid" in database
   - ✅ Buyer receives confirmation email
   - ✅ Seller receives sale notification email
   - ✅ Both users have in-app notifications

---

## 📧 Email Templates

### Buyer Confirmation Email
- **Subject:** "Your Reclaim Purchase Confirmation"
- **Includes:**
  - Order ID
  - Item details
  - Amount paid
  - Purchase date
  - Seller information
  - Next steps (what to expect)
  - Link to view order status

### Seller Notification Email
- **Subject:** "🎉 You sold [item name]! Prepare to ship"
- **Includes:**
  - Sale summary
  - Buyer information
  - Shipping address (if provided)
  - Payout amount (after platform fee)
  - Shipping checklist
  - Tips for packaging and shipping
  - Link to add tracking number

### Order Shipped Email (Buyer)
- **Subject:** "📦 Your order has shipped - [item name]"
- **Includes:**
  - Tracking number
  - Shipping carrier
  - Link to track package
  - Estimated delivery info

---

## 🔔 In-App Notifications

### Notification Types:

1. **`payment_success`** (Buyer)
   - Title: "✅ Payment Confirmed"
   - Message: "Your payment of $XX for '[item]' was successful..."
   - Link: `/orders/[orderId]`

2. **`item_sold`** (Seller)
   - Title: "💰 You Made a Sale!"
   - Message: "[Buyer] purchased '[item]' for $XX..."
   - Link: `/orders/[orderId]`

3. **`order_shipped`** (Buyer)
   - Title: "📦 Your Order Has Shipped"
   - Message: "'[item]' is on its way! Tracking: XXX"
   - Link: `/orders/[orderId]`

4. **`order_delivered`** (Buyer)
   - Title: "✅ Order Delivered"
   - Message: "'[item]' has been delivered..."
   - Link: `/orders/[orderId]`

---

## 🔄 End-to-End Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BUYER COMPLETES STRIPE CHECKOUT                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. STRIPE SENDS WEBHOOK: checkout.session.completed         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. RECLAIM WEBHOOK HANDLER                                  │
│    - Verifies webhook signature                             │
│    - Updates order status → "paid"                          │
│    - Stores payment_intent_id                               │
│    - Stores shipping address (if provided)                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SEND NOTIFICATIONS (Parallel)                            │
│                                                              │
│  ┌─────────────────┐        ┌──────────────────┐           │
│  │ BUYER            │        │ SELLER           │           │
│  ├─────────────────┤        ├──────────────────┤           │
│  │ • Email (📧)    │        │ • Email (📧)     │           │
│  │ • In-app (🔔)   │        │ • In-app (🔔)    │           │
│  │ • SMS (📱)*     │        └──────────────────┘           │
│  └─────────────────┘                                        │
│                                                              │
│  * SMS optional (Twilio integration stubbed)                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. BUYER REDIRECTED TO /orders/success                      │
│    - Shows order confirmation                               │
│    - Displays order details                                 │
│    - Shows next steps                                       │
│    - Link to message seller                                 │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SELLER SHIPS ITEM                                        │
│    - Adds tracking number in dashboard                      │
│    - Marks order as "shipped"                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. BUYER RECEIVES SHIPPING NOTIFICATION                     │
│    - Email with tracking number                             │
│    - In-app notification                                    │
│    - Link to track package                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Pre-Test Setup
- [ ] Database migration applied
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] Stripe CLI running (or webhook endpoint set up)
- [ ] Dev server running (`npm run dev`)

### Test 1: Successful Payment Flow
1. [ ] Create test listing as Seller A
2. [ ] Login as Buyer B
3. [ ] Purchase listing with test card
4. [ ] Complete Stripe checkout
5. [ ] **Verify:**
   - [ ] Redirected to `/orders/success`
   - [ ] Order status = "paid" in Supabase
   - [ ] Buyer receives confirmation email
   - [ ] Seller receives sale notification email
   - [ ] Buyer has notification in app
   - [ ] Seller has notification in app
   - [ ] Success page shows correct details

### Test 2: Email Content Verification
- [ ] Buyer email has order ID
- [ ] Buyer email has seller contact info
- [ ] Seller email has buyer shipping address
- [ ] Seller email has shipping checklist
- [ ] Both emails have correct amounts
- [ ] Links in emails work correctly

### Test 3: In-App Notifications
- [ ] Notifications appear in navbar badge
- [ ] Clicking notification navigates to order
- [ ] Mark as read functionality works
- [ ] Unread count updates correctly

### Test 4: Order Success Page
- [ ] Shows "Payment Successful" message
- [ ] Displays correct order details
- [ ] Shows seller information
- [ ] "Message Seller" link works
- [ ] "Continue Shopping" link works

### Test 5: Webhook Resilience
- [ ] Test with delayed webhook (order created first)
- [ ] Test with duplicate webhooks (idempotent)
- [ ] Test with missing order (creates from metadata)

### Test 6: Failed Payment Scenario
1. [ ] Use declined test card: `4000 0000 0000 0002`
2. [ ] **Verify:**
   - [ ] No email sent
   - [ ] No notification created
   - [ ] Order status remains "pending" or "failed"

---

## 📊 Example Test Payload

Use this JSON to simulate a Stripe webhook locally:

```json
{
  "id": "evt_test_webhook",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "object": "checkout.session",
      "amount_total": 2500,
      "currency": "usd",
      "customer_details": {
        "email": "buyer@university.edu",
        "name": "Test Buyer"
      },
      "payment_intent": "pi_test_123",
      "payment_status": "paid",
      "metadata": {
        "listingId": "your-listing-uuid",
        "buyerId": "buyer-user-uuid",
        "sellerId": "seller-user-uuid",
        "platformFeeCents": "250",
        "sellerAmountCents": "2250"
      },
      "shipping_details": {
        "address": {
          "city": "Berkeley",
          "country": "US",
          "line1": "123 University Ave",
          "postal_code": "94704",
          "state": "CA"
        },
        "name": "Test Buyer"
      }
    }
  }
}
```

Save as `test-webhook.json` and send with:
```bash
curl -X POST http://localhost:3001/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

---

## 🚨 Troubleshooting

### Emails Not Sending

**Check:**
1. `RESEND_API_KEY` is set correctly in `.env.local`
2. Server restarted after adding key
3. Check Resend dashboard for delivery status
4. Check server logs for email send errors

**Common Issues:**
- Invalid API key → Check Resend dashboard
- Rate limit exceeded → Free tier: 100/day
- Domain not verified → Optional for dev, required for production

### Webhooks Not Received

**Check:**
1. Stripe CLI is running (`stripe listen`)
2. Webhook secret matches CLI output
3. Endpoint URL is correct
4. Server is running on correct port

**Test:**
```bash
# Check if webhook endpoint is accessible
curl http://localhost:3001/api/stripe/webhook

# Should return: 400 Bad Request (missing signature)
# If 404 → endpoint not configured correctly
```

### Notifications Not Appearing

**Check:**
1. Database migration applied
2. RLS policies exist on `notifications` table
3. User ID matches between order and notification
4. Browser console for errors

**Verify:**
```sql
-- Check if notifications were created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Order Not Found on Success Page

**Check:**
1. Webhook processed successfully
2. Order exists in database with correct `stripe_checkout_session_id`
3. Session ID in URL matches order

**Debug:**
```sql
-- Find order by session ID
SELECT * FROM orders WHERE stripe_checkout_session_id = 'cs_test_...';
```

---

## 📈 Production Deployment

### Before Going Live:

1. **Update Environment Variables:**
   ```bash
   # Use production Stripe keys
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

   # Set production app URL
   NEXT_PUBLIC_APP_URL=https://your domain.com

   # Use production Resend API key (verify domain first)
   RESEND_API_KEY=re_live_...
   ```

2. **Set Up Production Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select same events as test mode
   - Copy NEW webhook secret (different from test)
   - Update `STRIPE_WEBHOOK_SECRET` in production env vars

3. **Verify Domain in Resend:**
   - Add your domain in Resend dashboard
   - Add DNS records (SPF, DKIM)
   - Wait for verification
   - Update from email address in `sendEmail.ts`

4. **Test in Production:**
   - Create real listing
   - Make test purchase (use Stripe test mode in prod first)
   - Verify all notifications work
   - Check email delivery rates in Resend

---

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Resend Documentation](https://resend.com/docs)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🎯 Success Criteria

Your post-payment system is working correctly when:

✅ **Buyer receives:**
- Confirmation email within 1 minute
- In-app notification immediately
- Can view order on success page
- Can message seller

✅ **Seller receives:**
- Sale notification email within 1 minute
- In-app notification immediately
- Buyer's shipping address (if provided)
- Clear shipping instructions

✅ **System maintains:**
- Idempotent webhook processing (no duplicates)
- Reliable email delivery (>95%)
- Fast notification creation (<1s)
- Accurate order tracking

---

**Need Help?** Check the troubleshooting section or review server logs for detailed error messages.
