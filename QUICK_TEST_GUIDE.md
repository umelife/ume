# 🚀 Quick Test Guide - Post-Payment System

**5-Minute Setup & Test**

---

## ⚡ Quick Setup (One-Time)

### 1. Get Resend API Key (2 minutes)
```bash
# 1. Go to: https://resend.com/signup
# 2. Sign up (free)
# 3. Go to: API Keys → Create API Key
# 4. Copy the key (re_...)
```

### 2. Add to Environment (30 seconds)
```bash
# Add to .env.local:
RESEND_API_KEY=re_your_key_here
```

### 3. Apply Database Migration (1 minute)
```bash
# Go to: https://supabase.com/dashboard/project/cfuzmkojjtzujgdghyvf/sql
# Copy & run: supabase/migrations/20250116000001_add_notifications_and_tracking.sql
```

### 4. Set Up Stripe Webhook (2 minutes)

**Option A: Quick (Stripe CLI)**
```bash
# Install: https://stripe.com/docs/stripe-cli#install
stripe login
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Copy webhook secret from output and add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Option B: Manual (Dashboard)**
- Dashboard → Webhooks → Add Endpoint
- URL: Use ngrok or skip for now
- Events: `checkout.session.completed`

---

## 🧪 Run Test (2 Minutes)

### 1. Start Server
```bash
npm run dev
```

### 2. Make Test Purchase
1. Login: `test@university.edu` (or create account)
2. Find any listing (not yours)
3. Click "Buy Now"
4. Use test card: `4242 4242 4242 4242`, Exp: `12/34`, CVC: `123`
5. Complete checkout

### 3. Verify Results ✅

**Should See:**
- ✅ Redirect to `/orders/success`
- ✅ "Payment Successful" page
- ✅ Email sent to buyer (check spam if using personal email)
- ✅ Email sent to seller
- ✅ Notifications in app (bell icon)

**Check Database:**
```sql
-- In Supabase SQL Editor:
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
-- Should show status = 'paid'

SELECT * FROM notifications ORDER BY created_at DESC LIMIT 2;
-- Should show 2 notifications (buyer + seller)
```

---

## 📧 Expected Emails

### Buyer Email
- **To:** Buyer's email
- **Subject:** "Your Reclaim Purchase Confirmation"
- **Contains:** Order ID, item, price, seller info

### Seller Email
- **To:** Seller's email
- **Subject:** "🎉 You sold [item]! Prepare to ship"
- **Contains:** Sale details, buyer info, shipping checklist

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| No emails | Check `RESEND_API_KEY` in `.env.local`, restart server |
| No redirect | Check Stripe webhook is running |
| 404 on success page | Check order was created in database |
| No notifications | Run database migration |

---

## 🎯 Success Checklist

- [ ] Setup completed (API keys, migration)
- [ ] Test purchase successful
- [ ] Buyer received email
- [ ] Seller received email
- [ ] Buyer has notification in app
- [ ] Seller has notification in app
- [ ] Success page shows order details

**All checked?** ✅ System is working!

---

**Full Guide:** See `POST_PAYMENT_GUIDE.md` for detailed documentation.
