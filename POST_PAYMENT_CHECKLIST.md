# ✅ Post-Payment System - Implementation Checklist

**Use this checklist to ensure complete setup and deployment.**

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Apply migration: `supabase/migrations/20250116000001_add_notifications_and_tracking.sql`
- [ ] Verify `notifications` table exists
- [ ] Verify `orders` table has new columns (tracking_number, shipped_at, etc.)
- [ ] Check RLS policies are enabled on `notifications`
- [ ] Test: `SELECT * FROM notifications LIMIT 1;` should work

### 2. Email Service (Resend)
- [ ] Sign up at https://resend.com
- [ ] Create API key
- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Restart dev server
- [ ] Verify no environment errors in logs

### 3. Stripe Webhook
- [ ] Install Stripe CLI (optional but recommended)
- [ ] Run: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
- [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`
- [ ] OR: Set up webhook endpoint in Stripe Dashboard
- [ ] Verify webhook events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`

### 4. Code Verification
- [ ] Run `npm install resend` (should be installed)
- [ ] Run `npm run build` - should succeed
- [ ] Run `npx tsc --noEmit` - should have no errors
- [ ] Check server logs for any startup errors

---

## 🧪 Testing Checklist

### Test 1: Email Sending (Standalone)
```typescript
// Quick test in Node REPL or test file:
import { sendBuyerConfirmation } from './lib/email/sendEmail'

await sendBuyerConfirmation({
  buyerEmail: 'your-email@test.com',
  buyerName: 'Test Buyer',
  orderId: 'test-123',
  listingTitle: 'Test Item',
  listingPrice: 2500,
  sellerName: 'Test Seller',
  sellerEmail: 'seller@test.com',
  orderDate: new Date().toISOString()
})
```
- [ ] Email received
- [ ] Template renders correctly
- [ ] All variables populated

### Test 2: Notification Creation
```sql
-- In Supabase SQL Editor:
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```
- [ ] Can query notifications
- [ ] RLS policies working

### Test 3: Complete Payment Flow
1. **Setup:**
   - [ ] Stripe CLI running OR webhook configured
   - [ ] Dev server running (`npm run dev`)
   - [ ] Two test users created (buyer & seller)

2. **Create Listing:**
   - [ ] Login as seller
   - [ ] Create test listing
   - [ ] Note listing ID

3. **Make Purchase:**
   - [ ] Login as buyer
   - [ ] Go to listing
   - [ ] Click "Buy Now"
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Complete checkout

4. **Verify Results:**
   - [ ] Redirected to `/orders/success`
   - [ ] Success page shows order details
   - [ ] Check database: `SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC LIMIT 1;`
   - [ ] Order status = 'paid'
   - [ ] Check emails:
     - [ ] Buyer received confirmation
     - [ ] Seller received notification
   - [ ] Check notifications:
     - [ ] `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 2;`
     - [ ] 2 notifications created (buyer + seller)
   - [ ] Check server logs:
     - [ ] No errors
     - [ ] "All payment notifications sent successfully" logged

### Test 4: Failed Payment
- [ ] Use declined card: `4000 0000 0000 0002`
- [ ] Payment fails at Stripe
- [ ] No emails sent
- [ ] No notifications created
- [ ] User stays on checkout page

### Test 5: Webhook Replay
- [ ] Resend same webhook (via Stripe Dashboard or CLI)
- [ ] Order not duplicated
- [ ] Notifications not duplicated
- [ ] Idempotent behavior confirmed

---

## 🚀 Production Deployment Checklist

### 1. Environment Variables
- [ ] `RESEND_API_KEY` set in production (get new key for production)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (NOT `sk_test_...`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = production webhook secret
- [ ] `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`

### 2. Resend Production Setup
- [ ] Verify domain in Resend dashboard
- [ ] Add DNS records (SPF, DKIM, DMARC)
- [ ] Wait for verification (usually < 1 hour)
- [ ] Update `from` email in `lib/email/sendEmail.ts` if needed
- [ ] Send test email to verify

### 3. Stripe Production Webhook
- [ ] Go to Stripe Dashboard → Webhooks (LIVE mode)
- [ ] Add endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `charge.refunded`
- [ ] Copy NEW webhook secret (different from test)
- [ ] Update production environment variable

### 4. Database
- [ ] Run migration in production Supabase
- [ ] Verify tables created
- [ ] Check RLS policies enabled
- [ ] Test query access

### 5. Initial Production Test
- [ ] Switch Stripe to test mode in production first
- [ ] Create test listing
- [ ] Make test purchase
- [ ] Verify all notifications work
- [ ] Switch to live mode
- [ ] Create real listing (small amount)
- [ ] Test with real card
- [ ] Verify everything works

---

## 📊 Monitoring Checklist

### Daily Checks (First Week)
- [ ] Check Resend dashboard for email delivery rates
- [ ] Check Stripe webhook logs for failures
- [ ] Review server logs for errors
- [ ] Query failed notifications:
  ```sql
  SELECT * FROM orders WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
  ```

### Weekly Checks
- [ ] Email delivery rate > 95%
- [ ] Webhook success rate > 99%
- [ ] No stuck orders (status = 'pending' for > 24 hours)
- [ ] Notification delivery working

### Monthly Maintenance
- [ ] Clear old read notifications (> 30 days)
- [ ] Review email templates for improvements
- [ ] Check Resend usage against limits
- [ ] Update documentation if needed

---

## 🐛 Troubleshooting Checklist

### Emails Not Sending
- [ ] Check `RESEND_API_KEY` in environment
- [ ] Server restarted after adding key?
- [ ] Check Resend dashboard → Emails tab
- [ ] Check server logs for email errors
- [ ] Free tier limit reached? (100/day, 3000/month)
- [ ] Domain verified? (production only)

### Webhooks Not Working
- [ ] Stripe CLI running? (`stripe listen`)
- [ ] Webhook secret correct in `.env.local`?
- [ ] Server running on correct port?
- [ ] Check Stripe Dashboard → Webhooks → View logs
- [ ] Endpoint URL correct?
- [ ] Events selected correctly?

### Notifications Not Appearing
- [ ] Database migration applied?
- [ ] RLS policies exist?
- [ ] User logged in?
- [ ] Check database: `SELECT * FROM notifications WHERE user_id = 'uuid';`
- [ ] Server logs show notification creation?

### Success Page Not Loading
- [ ] Webhook processed?
- [ ] Order exists in database?
- [ ] Session ID in URL matches order?
- [ ] Check server logs for errors
- [ ] RLS blocking access?

---

## ✅ Final Verification

Before marking as complete, verify:

- [ ] **End-to-End Test Passed**
  - Real purchase completed
  - Buyer received email
  - Seller received email
  - Both have notifications
  - Success page loaded
  - All data accurate

- [ ] **Documentation Complete**
  - [ ] `POST_PAYMENT_GUIDE.md` reviewed
  - [ ] `QUICK_TEST_GUIDE.md` tested
  - [ ] `IMPLEMENTATION_SUMMARY.md` accurate
  - [ ] All team members aware of new system

- [ ] **Production Ready**
  - [ ] All environment variables set
  - [ ] Domain verified in Resend
  - [ ] Webhook configured in Stripe
  - [ ] Monitoring in place

---

## 📞 Support Contacts

**Resend Support:**
- Dashboard: https://resend.com
- Docs: https://resend.com/docs
- Support: support@resend.com

**Stripe Support:**
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Support: support@supabase.io

---

## 🎉 Success Criteria

✅ **System is working when:**

1. Every successful payment triggers:
   - 2 emails (buyer + seller)
   - 2 notifications (buyer + seller)
   - Redirect to success page

2. All emails deliver within 60 seconds

3. Success page shows accurate information

4. Notifications appear in app immediately

5. No errors in server logs

6. Webhook success rate > 99%

7. Email delivery rate > 95%

---

**Status:** [ ] Not Started  |  [ ] In Progress  |  [ ] Complete  |  [ ] Production Ready

**Deployed By:** _______________
**Deployment Date:** _______________
**Verified By:** _______________
**Verification Date:** _______________
