/**
 * Stripe Checkout Session Route
 *
 * Creates a Stripe hosted checkout session for a buyer to purchase a listing.
 * Supports both in-person (Stripe escrow) and shipping fulfillment types.
 *
 * Flow:
 *   1. POST with { listingId, fulfillmentType, shippingAddress?, easypostRateId?, shippingCostCents? }
 *   2. Server validates listing, seller Stripe account, and buyer auth
 *   3. Creates pending order in database
 *   4. Creates Stripe Checkout Session with destination charge (0% platform fee)
 *   5. Returns { url } — frontend redirects buyer to Stripe hosted checkout
 *   6. After payment, Stripe webhook updates order to 'paid'
 *
 * Commission: 0% — no application fee collected (add fee here when commission is introduced)
 * Payout: Funds transfer directly to seller's Stripe Express account via destination charge
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the request body
    const body = await request.json()
    const {
      listingId,
      fulfillmentType = 'in_person',
      shippingAddress,
      easypostRateId,
      easypostShipmentId,
      shippingCostCents = 0,
    } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    // 2. Authenticate the buyer
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createServiceClient()

    // 3. Fetch the listing and seller details
    const { data: listing, error: listingError } = await db
      .from('listings')
      .select('*, seller:users!listings_user_id_fkey(id, display_name, email, stripe_account_id, stripe_onboarding_completed)')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // 4. Prevent buying your own listing
    if (listing.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 })
    }

    // 5. Prevent buying already-sold listings
    if (listing.status === 'sold' || listing.status === 'reserved') {
      return NextResponse.json({ error: 'This listing is no longer available' }, { status: 400 })
    }

    const seller = listing.seller as any

    // 6. Verify seller has completed Stripe Express onboarding
    //    Required to transfer funds to the seller after payment
    if (!seller?.stripe_account_id || !seller?.stripe_onboarding_completed) {
      return NextResponse.json(
        { error: 'Seller has not set up Stripe payments yet' },
        { status: 400 }
      )
    }

    // 7. If shipping, require a shipping address
    if (fulfillmentType === 'shipping' && !shippingAddress) {
      return NextResponse.json({ error: 'Shipping address required for shipped orders' }, { status: 400 })
    }

    // 8. Calculate amounts
    //    price is stored in cents in the database
    const listingPriceCents = listing.price
    const totalAmountCents = listingPriceCents + shippingCostCents
    // Platform fee = 0 (no commission yet — update this line when commission is introduced)
    const platformFeeCents = 0
    const sellerAmountCents = totalAmountCents - platformFeeCents

    // 9. Fetch buyer profile
    const { data: buyer } = await db
      .from('users')
      .select('email, display_name')
      .eq('id', user.id)
      .single()

    // 10. Build line items — listing price + optional shipping surcharge
    const lineItems: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            description: listing.description?.substring(0, 500) || undefined,
            images: listing.image_urls?.slice(0, 1) || [],
          },
          unit_amount: listingPriceCents,
        },
        quantity: 1,
      },
    ]

    if (shippingCostCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: shippingCostCents,
        },
        quantity: 1,
      })
    }

    // 11. Create a pending order in the database
    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: listing.user_id,
        listing_id: listing.id,
        amount_cents: totalAmountCents,
        currency: 'usd',
        platform_fee_cents: platformFeeCents,
        seller_amount_cents: sellerAmountCents,
        status: 'pending',
        payment_method: 'stripe',
        buyer_email: buyer?.email || user.email,
        buyer_name: buyer?.display_name || 'Buyer',
        fulfillment_type: fulfillmentType,
        shipping_cost_cents: shippingCostCents,
        easypost_shipment_id: easypostShipmentId || null,
        easypost_rate_id: easypostRateId || null,
        buyer_shipping_address: shippingAddress || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // 12. Create the Stripe Checkout Session
    //     Uses a destination charge — buyer pays UME, funds transfer to seller's Express account
    //     application_fee_amount = 0 (no commission yet)
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: buyer?.email || user.email || undefined,
      payment_intent_data: {
        // Transfer the full amount to the seller (0% fee)
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
        // In-person: authorize only — funds captured when QR scan confirms meetup
        ...(fulfillmentType === 'in_person' ? { capture_method: 'manual' } : {}),
      },
      metadata: {
        orderId: order.id,
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.user_id,
        fulfillmentType,
      },
      success_url: `${APP_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${APP_URL}/item/${listingId}?cancelled=true`,
      // Session expires in 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    // 13. Save the checkout session ID to the order
    await db
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
