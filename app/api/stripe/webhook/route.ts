/**
 * Stripe Webhook Handler
 *
 * Handles both standard Stripe events (checkout, payments, refunds) and
 * V2 "thin" events for connected account requirement changes.
 *
 * Standard events (regular webhooks):
 *   - checkout.session.completed → mark order paid, reserve listing, notify buyer/seller
 *   - charge.refunded → mark order refunded
 *
 * V2 thin events (connected account webhooks):
 *   - v2.core.account[requirements].updated → re-check seller onboarding status
 *   - v2.core.account[.recipient].capability_status_updated → update stripe_onboarding_completed
 *
 * Setup:
 *   1. Standard webhooks: https://dashboard.stripe.com/webhooks → add /api/stripe/webhook
 *   2. V2 thin events: Dashboard → Webhooks → Add destination → Connected accounts → thin payload
 *      Select: v2.core.account[requirements].updated + v2.core.account[.recipient].capability_status_updated
 *
 * Local testing with Stripe CLI:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' --forward-thin-to localhost:3000/api/stripe/webhook/v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyBuyerPaymentSuccess, notifySellerItemSold } from '@/lib/notifications/createNotification'

export const runtime = 'nodejs'

// Webhook secret from Stripe dashboard (set in .env.local as STRIPE_WEBHOOK_SECRET)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Verify the webhook signature to ensure it came from Stripe
    let event: any
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const db = await createServiceClient()

    switch (event.type) {

      // ─── Checkout completed — buyer paid successfully ───────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const { orderId, listingId, buyerId, sellerId, fulfillmentType } = session.metadata || {}

        if (!orderId) break

        const now = new Date().toISOString()

        if (fulfillmentType === 'in_person') {
          // Card authorized (manual capture) — NOT charged yet.
          // Funds are released when buyer scans QR at the meetup.
          // Keep order as 'pending' — QR scan will update to 'completed'.
          await db.from('orders').update({
            status: 'pending',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
          }).eq('id', orderId)

          // Reserve listing to prevent double-booking
          if (listingId) {
            await db.from('listings').update({ status: 'reserved' }).eq('id', listingId)
          }
        } else {
          // Shipping — immediate charge, order is paid
          await db.from('orders').update({
            status: 'paid',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            completed_at: now,
          }).eq('id', orderId)

          if (listingId) {
            await db.from('listings').update({ status: 'reserved' }).eq('id', listingId)
          }
        }

        // Notify buyer and seller (fetch listing title + amount for notification text)
        if (buyerId && sellerId && listingId) {
          const [{ data: orderData }, { data: listingData }, { data: buyerData }] = await Promise.all([
            db.from('orders').select('amount_cents').eq('id', orderId).single(),
            db.from('listings').select('title').eq('id', listingId).single(),
            db.from('users').select('display_name').eq('id', buyerId).single(),
          ])
          await Promise.all([
            notifyBuyerPaymentSuccess({
              buyerId,
              orderId,
              listingId,
              listingTitle: listingData?.title || 'Item',
              amount: orderData?.amount_cents || 0,
            }),
            notifySellerItemSold({
              sellerId,
              orderId,
              listingId,
              listingTitle: listingData?.title || 'Item',
              amount: orderData?.amount_cents || 0,
              buyerName: buyerData?.display_name || 'A buyer',
            }),
          ]).catch(err => console.error('Notification error:', err))
        }

        break
      }

      // ─── Charge refunded ────────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent

        if (!paymentIntentId) break

        // Find the order by payment intent and mark it refunded
        const { data: order } = await db
          .from('orders')
          .select('id, listing_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single()

        if (order) {
          await db.from('orders').update({
            status: 'refunded',
            stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
            refunded_at: new Date().toISOString(),
          }).eq('id', order.id)

          // Re-list the listing as active
          if (order.listing_id) {
            await db.from('listings').update({ status: 'active' }).eq('id', order.listing_id)
          }
        }

        break
      }

      // ─── Connected account updated — seller Stripe onboarding ───────────────
      case 'account.updated': {
        const account = event.data.object
        // Check if the connected account now has transfers enabled
        const onboardingComplete = account.details_submitted && account.charges_enabled

        if (account.id) {
          await db.from('users').update({
            stripe_onboarding_completed: onboardingComplete,
          }).eq('stripe_account_id', account.id)
        }

        break
      }

      default:
        // Unhandled event type — log and ignore
        break
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
