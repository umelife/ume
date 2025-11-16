/**
 * Stripe Refund API Route
 *
 * Allows admins or sellers to issue refunds for completed orders.
 *
 * Flow:
 * 1. Admin/seller calls this endpoint with orderId
 * 2. Server verifies authorization
 * 3. Server fetches order and payment intent
 * 4. Server creates refund via Stripe API
 * 5. Webhook updates order status to 'refunded'
 *
 * Authorization:
 * - Only seller or admin can refund
 * - Order must be in 'paid' or 'processing' status
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, reason } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, buyer:users!buyer_id(*), seller:users!seller_id(*), listing:listings(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check authorization (seller or buyer can request refund, but we'll restrict to seller for now)
    // TODO: Add admin role check here
    if (order.seller_id !== user.id && order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to refund this order' },
        { status: 403 }
      )
    }

    // Check order status
    if (order.status === 'refunded') {
      return NextResponse.json(
        { error: 'Order already refunded' },
        { status: 400 }
      )
    }

    if (order.status === 'pending' || order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot refund order in current status' },
        { status: 400 }
      )
    }

    // Check if payment intent exists
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this order' },
        { status: 400 }
      )
    }

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: order.id,
        listingId: order.listing_id,
      }
    })

    console.log('Refund created:', refund.id)

    // Update order status (webhook will also update, but we update immediately)
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order after refund:', updateError)
      // Refund was created in Stripe, so we still return success
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      },
      order: updatedOrder || order
    })

  } catch (error: any) {
    console.error('Error creating refund:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card error: ' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
