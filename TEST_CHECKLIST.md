# 🧪 Complete Testing Checklist

**Use this checklist to verify everything is working after applying the migration.**

---

## ⚠️ BEFORE TESTING

### Step 1: Apply the Migration
- [ ] Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/cfuzmkojjtzujgdghyvf/sql/new)
- [ ] Copy SQL from `supabase/migrations/20250116000000_fix_user_creation.sql`
- [ ] Paste and click "Run"
- [ ] Verify "Success" message

---

## 🧪 TESTING PHASE

### 1. Development Server ✅
- [x] Server started successfully
- [x] Running on http://localhost:3001
- [x] No compilation errors
- [x] Middleware compiled

---

### 2. Authentication Tests

#### Signup Flow
- [ ] Navigate to http://localhost:3001/signup
- [ ] Enter test .edu email (e.g., `test@university.edu`)
- [ ] Enter display name
- [ ] Enter password
- [ ] Click "Sign up"
- [ ] **VERIFY:** Check browser console - **NO ERRORS** ✅
- [ ] **VERIFY:** Redirected to marketplace or email verification page
- [ ] **VERIFY:** In Supabase → Table Editor → users → New row exists

#### Login Flow
- [ ] Navigate to http://localhost:3001/login
- [ ] Enter registered .edu email
- [ ] Enter password
- [ ] Click "Sign in"
- [ ] **VERIFY:** Check browser console - **NO ERRORS** ✅
- [ ] **VERIFY:** Redirected to marketplace
- [ ] **VERIFY:** Navbar shows user info

#### Session Persistence
- [ ] After logging in, refresh the page
- [ ] **VERIFY:** Still logged in (no redirect to login)
- [ ] Navigate to different pages
- [ ] **VERIFY:** User session persists

#### Logout
- [ ] Click logout button
- [ ] **VERIFY:** Redirected to home page
- [ ] **VERIFY:** Session cleared
- [ ] Try accessing protected route (e.g., /create)
- [ ] **VERIFY:** Redirected to login

---

### 3. Listings Tests

#### Create Listing
- [ ] Log in to the application
- [ ] Navigate to http://localhost:3001/create
- [ ] Fill in listing details:
  - [ ] Title
  - [ ] Description
  - [ ] Category
  - [ ] Price
- [ ] Upload 1-3 images
- [ ] Click "Create Listing"
- [ ] **VERIFY:** Redirected to listing detail page
- [ ] **VERIFY:** Images display correctly
- [ ] **VERIFY:** All details shown accurately

#### View Listing
- [ ] Navigate to marketplace
- [ ] Click on a listing
- [ ] **VERIFY:** All details load
- [ ] **VERIFY:** Images display with thumbnails
- [ ] **VERIFY:** Seller information shown
- [ ] **VERIFY:** Chat box appears (if logged in)

#### Edit Listing
- [ ] Go to your own listing
- [ ] Click "Edit Listing"
- [ ] Modify title or price
- [ ] Click "Save"
- [ ] **VERIFY:** Changes saved
- [ ] **VERIFY:** Updated data displays

#### Delete Listing
- [ ] Go to your own listing
- [ ] Click "Delete" (if available)
- [ ] Confirm deletion
- [ ] **VERIFY:** Listing removed from marketplace
- [ ] **VERIFY:** Images removed from storage

---

### 4. Marketplace Tests

#### Browse Listings
- [ ] Navigate to http://localhost:3001/marketplace
- [ ] **VERIFY:** Listings display in grid
- [ ] **VERIFY:** Images load correctly
- [ ] **VERIFY:** Prices formatted properly

#### Search Functionality
- [ ] Enter search term in search box
- [ ] **VERIFY:** Results filter in real-time
- [ ] Clear search
- [ ] **VERIFY:** All listings shown again

#### Category Filter
- [ ] Select a category from dropdown
- [ ] **VERIFY:** Only listings in that category show
- [ ] Select "All Categories"
- [ ] **VERIFY:** All listings shown

---

### 5. Messaging Tests

#### Send Message
- [ ] Open a listing (not your own)
- [ ] Type message in chat box
- [ ] Click "Send"
- [ ] **VERIFY:** Message appears instantly
- [ ] **VERIFY:** Timestamp shown
- [ ] **VERIFY:** No console errors

#### Real-time Delivery
- [ ] Open same listing in different browser/incognito
- [ ] Log in as different user
- [ ] Send message from one user
- [ ] **VERIFY:** Other user sees message in real-time (no refresh needed)

#### Typing Indicator
- [ ] Start typing in chat box
- [ ] **VERIFY:** Other user sees "User is typing..." (if implemented)

#### Read Status
- [ ] Send a message
- [ ] View from recipient's account
- [ ] **VERIFY:** Unread count shows
- [ ] Open conversation
- [ ] **VERIFY:** Message marked as read
- [ ] **VERIFY:** Unread count decreases

#### Edit Message
- [ ] Hover over your own message
- [ ] Click edit icon
- [ ] Modify message text
- [ ] Save
- [ ] **VERIFY:** Message updated
- [ ] **VERIFY:** Shows "(edited)" indicator

#### Delete Message
- [ ] Hover over your own message
- [ ] Click delete icon
- [ ] Confirm deletion
- [ ] **VERIFY:** Message removed
- [ ] **VERIFY:** Other user sees deletion in real-time

#### Messages Inbox
- [ ] Navigate to http://localhost:3001/messages
- [ ] **VERIFY:** All conversations listed
- [ ] **VERIFY:** Unread counts shown
- [ ] **VERIFY:** Last message preview shown
- [ ] Click on a conversation
- [ ] **VERIFY:** Opens full chat

---

### 6. Payment Tests (Stripe Test Mode)

#### Checkout Flow
- [ ] Open a listing (not your own)
- [ ] Click "Buy Now"
- [ ] **VERIFY:** Redirected to Stripe checkout
- [ ] **VERIFY:** Correct amount shown
- [ ] **VERIFY:** Listing details displayed

#### Test Payment
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., 12/34)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] Complete checkout
- [ ] **VERIFY:** Redirected to success page
- [ ] **VERIFY:** Order confirmation shown

#### Order Tracking
- [ ] Go to Supabase → Table Editor → orders
- [ ] **VERIFY:** New order record exists
- [ ] **VERIFY:** Status is "paid" (after webhook)
- [ ] **VERIFY:** Amounts calculated correctly

#### Cancel Checkout
- [ ] Start checkout process
- [ ] Click "Back" or close tab
- [ ] **VERIFY:** Redirected to listing page
- [ ] **VERIFY:** `?cancelled=true` in URL

---

### 7. Image Tests

#### Upload Images
- [ ] Create new listing
- [ ] Click image upload
- [ ] Select multiple images (up to 10)
- [ ] **VERIFY:** Thumbnails show during upload
- [ ] **VERIFY:** Progress indicators work
- [ ] Submit listing
- [ ] **VERIFY:** Images uploaded to Supabase Storage

#### Display Images
- [ ] View listing with images
- [ ] **VERIFY:** Main image displays
- [ ] **VERIFY:** Thumbnail gallery shown
- [ ] Click different thumbnails
- [ ] **VERIFY:** Main image changes
- [ ] **VERIFY:** Images load without errors

#### Image Performance
- [ ] Check Network tab in DevTools
- [ ] **VERIFY:** Images lazy-load
- [ ] **VERIFY:** Proper image sizes served
- [ ] **VERIFY:** No 404 errors for images

---

### 8. Profile Tests

#### View Profile
- [ ] Navigate to http://localhost:3001/profile/[your-user-id]
- [ ] **VERIFY:** Display name shown
- [ ] **VERIFY:** University domain shown
- [ ] **VERIFY:** "Member since" date shown
- [ ] **VERIFY:** User's listings displayed

#### View Other Profile
- [ ] Click on a seller name from a listing
- [ ] **VERIFY:** Redirected to their profile
- [ ] **VERIFY:** Their listings shown
- [ ] **VERIFY:** Can't edit their listings

---

### 9. Security Tests

#### Protected Routes
- [ ] Log out
- [ ] Try accessing http://localhost:3001/create
- [ ] **VERIFY:** Redirected to login
- [ ] Try accessing http://localhost:3001/messages
- [ ] **VERIFY:** Redirected to login

#### RLS Enforcement
- [ ] Try to edit someone else's listing (via UI)
- [ ] **VERIFY:** Edit button not shown
- [ ] Try to delete someone else's listing
- [ ] **VERIFY:** Delete button not shown

#### Authentication State
- [ ] Log in
- [ ] Check navbar
- [ ] **VERIFY:** Shows "Profile", "Logout"
- [ ] Log out
- [ ] **VERIFY:** Shows "Sign in", "Get started"

---

### 10. Error Handling Tests

#### Invalid Email
- [ ] Try signing up with non-.edu email
- [ ] **VERIFY:** Error message shown
- [ ] **VERIFY:** Form not submitted

#### Invalid Data
- [ ] Try creating listing with empty title
- [ ] **VERIFY:** Validation error shown
- [ ] Try negative price
- [ ] **VERIFY:** Error shown

#### Network Errors
- [ ] Disable internet temporarily
- [ ] Try sending message
- [ ] **VERIFY:** Error message shown
- [ ] Re-enable internet
- [ ] Try again
- [ ] **VERIFY:** Works correctly

---

### 11. Console Checks

Throughout all testing, continuously check browser console:

- [ ] **NO RLS policy violation errors** ✅
- [ ] **NO "new row violates" errors** ✅
- [ ] **NO authentication errors** ✅
- [ ] **NO Supabase errors** ✅
- [ ] Only informational logs or expected warnings

---

### 12. Database Verification

#### Check Users Table
- [ ] Go to Supabase → Table Editor → users
- [ ] **VERIFY:** New users have:
  - [ ] id (UUID)
  - [ ] email (.edu)
  - [ ] display_name (filled)
  - [ ] university_domain (extracted from email)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### Check Trigger
- [ ] Go to Supabase → Database → Functions
- [ ] **VERIFY:** `handle_new_user()` function exists
- [ ] Go to Database → Triggers
- [ ] **VERIFY:** `on_auth_user_created` trigger exists
- [ ] **VERIFY:** Trigger is enabled

---

## 🎯 Success Criteria

All checkboxes above should be checked ✅

**Critical Success Indicators:**
1. ✅ Zero console errors during signup
2. ✅ User profiles created automatically
3. ✅ All CRUD operations working
4. ✅ Real-time messaging functional
5. ✅ Stripe checkout working
6. ✅ Images uploading and displaying
7. ✅ RLS policies enforcing properly
8. ✅ Sessions persisting correctly

---

## 🚨 If You Find Issues

### Console Errors
1. Take screenshot of error
2. Check [BUG_FIXES_SUMMARY.md](BUG_FIXES_SUMMARY.md)
3. Verify migration was applied correctly

### Feature Not Working
1. Check [INTEGRATION_HEALTH_CHECK.md](INTEGRATION_HEALTH_CHECK.md)
2. Verify environment variables in `.env.local`
3. Check Supabase RLS policies

### Database Issues
1. Verify all migrations applied
2. Check table structure in Supabase
3. Verify RLS policies enabled

---

## 📊 Testing Report Template

After testing, fill out this report:

```
Testing Date: ___________
Tester: ___________

Results:
[ ] All tests passed ✅
[ ] Issues found (list below)

Issues:
1. _______________________________
2. _______________________________

Console Errors: Yes / No
If yes, describe: _______________________________

Overall Status: PASS / FAIL

Notes:
_______________________________
_______________________________
```

---

## ✅ Post-Testing

Once all tests pass:

- [ ] Clear browser cache
- [ ] Test with fresh browser session
- [ ] Test on different browser
- [ ] Ready for production deployment!

---

**Happy Testing! 🎉**
