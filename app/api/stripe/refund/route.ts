/**
 * Stripe Refund Route
 *
 * Issues a full refund for a paid order.
 * Only the buyer, seller, or an admin can request a refund.
 *
 * After refund:
 *   - Order status → 'refunded'
 *   - Listing status → 'active' (re-listed)
 *   - Stripe reverses the transfer to the seller's Express account automatically
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin/verify'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the requester
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse the request
    const { orderId, reason = 'requested_by_customer' } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // 3. Fetch the order
    const db = await createServiceClient()
    const { data: order, error: orderError } = await db
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 4. Verify the requester is the buyer, seller, or admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin && order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Only paid orders can be refunded
    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: `Cannot refund order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // 6. Require a Stripe payment intent to issue a refund
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No Stripe payment found for this order' },
        { status: 400 }
      )
    }

    // 7. Issue the refund via Stripe
    //    Stripe automatically reverses the transfer to the seller's Express account
    const refund = await stripeClient.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reason: reason as any,
    })

    // 8. Update the order status
    await db.from('orders').update({
      status: 'refunded',
      stripe_refund_id: refund.id,
      refunded_at: new Date().toISOString(),
    }).eq('id', orderId)

    // 9. Re-activate the listing so it can be sold again
    if (order.listing_id) {
      await db.from('listings').update({ status: 'active' }).eq('id', order.listing_id)
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    })

  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Refund failed' },
      { status: 500 }
    )
  }
}
