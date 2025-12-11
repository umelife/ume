# Cart MVP - Payment-Free Contact Seller Flow

**Date:** December 11, 2025
**Branch:** `chore/cart-contact-seller-mvp-20251211`

## Overview

This document describes the payment-free Cart MVP implementation that replaces checkout/payment flows with direct seller contact functionality.

## What Changed

### 1. Cart Page (`app/cart/page.tsx`)
- **Removed:** "Proceed to Checkout" button
- **Removed:** Order summary with shipping calculations
- **Added:** Contact Seller buttons for each cart item
- **Added:** Cart Summary with helper text about contacting sellers
- **Added:** localStorage fallback for guest users (`reclaim_cart` key)

### 2. Cart API (`app/api/cart/route.ts`)
- **Created:** `GET /api/cart` - Returns cart items for logged-in users
- **Created:** `DELETE /api/cart` - Removes items from cart
- **Format:** Returns `CartRow` objects with seller info for Contact Seller flow

### 3. CartItem Component (`components/cart/CartItem.tsx`)
- **Created:** New component for rendering cart items
- **Features:**
  - "Contact Seller (Pickup)" button with prefilled pickup message
  - "Ask About Shipping" button with prefilled shipping inquiry
  - Remove button
  - Displays seller name, campus, and listing details

### 4. BuyButton Component (`components/listings/BuyButton.tsx`)
- **Removed:** "Buy Now" button
- **Added:** "Contact Seller" button that navigates to messages with prefill
- **Kept:** "Add to Cart" button
- **Added:** Helper text explaining to contact seller for payment

### 5. Payment Endpoints
- **File:** `app/api/stripe/create-checkout-session/route.ts`
- **Status:** Returns HTTP 501 (Not Implemented)
- **Message:** "Payments disabled for MVP"
- **Code:** All Stripe logic commented out with restoration instructions

### 6. Messages Page
- **Note:** Messages page supports `?prefill=` query parameter
- **Usage:** Contact Seller buttons encode messages and pass via URL
- **Implementation:** Manual prefilling in message input (wrapper created but not integrated)

## User Flow

### Cart with Contact Seller
1. User adds items to cart via "Add to Cart" button on listing pages
2. Cart page shows items with seller information
3. User clicks "Contact Seller" or "Ask About Shipping" button
4. Redirects to `/messages` page with prefilled message
5. User sends message to seller
6. Seller and buyer arrange payment (PayPal/Venmo/Cash) and pickup/shipping

### Listing Detail with Contact Seller
1. User views listing detail page
2. Clicks "Contact Seller" button (replaces "Buy Now")
3. Redirects to messages with prefilled interest message
4. Arranges payment and pickup directly with seller

## localStorage Cart Format

For guest users, cart is stored in `localStorage` with key `reclaim_cart`:

```json
[
  {
    "id": "unique-id",
    "listing_id": "listing-uuid",
    "title": "Item Title",
    "price": 1250,
    "qty": 1,
    "seller_id": "seller-uuid",
    "seller_name": "John Doe",
    "seller_campus": "example.edu",
    "image_url": "/path/to/image.jpg"
  }
]
```

## Prefilled Messages

### Pickup Message
```
Hi — I'm interested in "[TITLE]". I'm on campus and would like to pick up. Are you available? Suggested meetup: campus post office.
```

### Shipping Message
```
Hi — I'm interested in "[TITLE]". Would you be able to ship to my campus post office? I will cover shipping via PayPal/Venmo.
```

## Files Modified/Created

### Created
- `app/api/cart/route.ts`
- `components/cart/CartItem.tsx`
- `app/messages/MessagesPageWrapper.tsx` (prepared for prefill support)
- `docs/cart-mvp.md` (this file)

### Modified
- `app/cart/page.tsx`
- `components/listings/BuyButton.tsx`
- `app/api/stripe/create-checkout-session/route.ts`

## How to Re-Enable Payments

When ready to implement Stripe/PayPal payments, follow these steps:

### 1. Restore Stripe Checkout Endpoint
**File:** `app/api/stripe/create-checkout-session/route.ts`

```typescript
// Remove the 501 response at the top of POST function
// Uncomment all code in the /* DISABLED - Original payment flow */ block
// Ensure STRIPE_SECRET_KEY is set in environment variables
```

### 2. Restore Buy Now Button
**File:** `components/listings/BuyButton.tsx`

```typescript
// Replace handleContactSeller function with handleBuyNow function
// Restore original button that calls handleBuyNow
// Original code available in git history: commit before this branch
```

### 3. Restore Cart Checkout Flow
**File:** `app/cart/page.tsx`

```typescript
// Add back "Proceed to Checkout" button
// Add handleCheckout function that calls /api/stripe/create-checkout-session
// Remove "Contact Seller" buttons from cart summary
// Original code available in git history
```

### 4. Remove Contact Seller Buttons
**Files:** `components/cart/CartItem.tsx`, `components/listings/BuyButton.tsx`

```typescript
// Remove Contact Seller button implementations
// Or keep them as secondary option alongside Buy Now
```

### 5. Environment Variables
Ensure these are set:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 6. Test Payment Flow
```bash
# Use Stripe test cards
# 4242 4242 4242 4242 - Success
# 4000 0000 0000 9995 - Declined
```

## Testing Locally

### Test with localStorage Cart

```javascript
// Open browser console on /cart page
localStorage.setItem('reclaim_cart', JSON.stringify([
  {
    id: '1',
    listing_id: 'L1',
    title: 'Test Textbook',
    price: 1250,
    qty: 1,
    seller_id: 'seller123',
    seller_name: 'Alex Johnson',
    seller_campus: 'ualbany.edu',
    image_url: null
  }
]))

// Refresh page - cart should display with Contact Seller buttons
```

### Test Contact Seller Flow

1. Add item to cart via listing page
2. Go to `/cart`
3. Click "Contact Seller" or "Ask About Shipping"
4. Should redirect to `/messages?listing=...&seller=...&prefill=...`
5. Verify message input has prefilled text

### Test API Endpoints

```bash
# Get cart (requires authentication)
curl http://localhost:3000/api/cart

# Remove item (requires authentication)
curl -X DELETE http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"id":"cart-item-id"}'

# Test disabled payment endpoint
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"listingId":"test"}'
# Should return 501 with "Payments disabled for MVP" message
```

## TODOs

- [ ] Integrate MessagesPageWrapper with prefill support in messages page
- [ ] Add analytics tracking for Contact Seller button clicks
- [ ] Consider adding "Offer Price" feature for negotiations
- [ ] Add seller response rate/time metrics
- [ ] Create admin dashboard to monitor seller contacts vs completed sales

## Notes

- Prices are still displayed throughout the app (not removed)
- Cart functionality remains for item organization
- Seller contact is the primary CTA instead of payment
- Fallback to localStorage ensures guest users can browse and save items
- All payment code is preserved in comments for easy restoration

## Support

For questions about this implementation, see:
- Original requirements in PR description
- Git history for original payment flow code
- Stripe integration docs: `/docs/STRIPE_SETUP_GUIDE.md`
