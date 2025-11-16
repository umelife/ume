/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events to update order status.
 *
 * Events handled:
 * - checkout.session.completed: Update order to 'paid'
 * - payment_intent.succeeded: Confirm payment success
 * - charge.refunded: Update order to 'refunded'
 *
 * Setup:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/stripe/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded, charge.refunded
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout session completed:', session.id)

        // Update order status to 'paid'
        const { data: order, error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            payment_method: session.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_checkout_session_id', session.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating order:', updateError)

          // If order doesn't exist, create it from session metadata
          if (updateError.code === 'PGRST116') {
            const metadata = session.metadata
            if (metadata) {
              const { error: createError } = await supabase
                .from('orders')
                .insert({
                  buyer_id: metadata.buyerId,
                  seller_id: metadata.sellerId,
                  listing_id: metadata.listingId,
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: session.payment_intent as string,
                  amount_cents: session.amount_total || 0,
                  currency: session.currency || 'usd',
                  platform_fee_cents: parseInt(metadata.platformFeeCents || '0'),
                  seller_amount_cents: parseInt(metadata.sellerAmountCents || '0'),
                  status: 'paid',
                  buyer_email: session.customer_details?.email || metadata.buyerEmail,
                  buyer_name: session.customer_details?.name || metadata.buyerName,
                  payment_method: session.payment_method_types?.[0] || 'card',
                })

              if (createError) {
                console.error('Error creating order from webhook:', createError)
              }
            }
          }
        } else {
          console.log('Order updated successfully:', order.id)
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('Payment intent succeeded:', paymentIntent.id)

        // Update order with payment intent details
        await supabase
          .from('orders')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge as string,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        console.log('Charge refunded:', charge.id)

        // Update order status to 'refunded'
        const { data: order, error: refundError } = await supabase
          .from('orders')
          .update({
            status: 'refunded',
            stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_charge_id', charge.id)
          .select()
          .single()

        if (refundError) {
          console.error('Error updating refunded order:', refundError)
        } else {
          console.log('Order refunded successfully:', order.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhook to work properly
export const dynamic = 'force-dynamic'
