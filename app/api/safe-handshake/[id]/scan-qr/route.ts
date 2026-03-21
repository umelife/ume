import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripeClient } from '@/lib/stripe/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    // Fetch the handshake
    const { data: handshake, error: fetchError } = await supabase
      .from('safe_handshakes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !handshake) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if expired
    if (new Date(handshake.expires_at) < new Date()) {
      const serviceSupabase = await createServiceClient()
      await serviceSupabase.from('safe_handshakes').update({ status: 'cancelled' }).eq('id', id)
      await serviceSupabase.from('listings').update({ status: 'active' }).eq('id', handshake.listing_id)
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 })
    }

    // Only the buyer can scan
    if (user.id !== handshake.buyer_id) {
      return NextResponse.json({ error: 'Only the buyer can scan the QR code' }, { status: 403 })
    }

    // Must be in qr_generated state
    if (handshake.status !== 'qr_generated') {
      return NextResponse.json({ error: 'No QR code is active for this session' }, { status: 400 })
    }

    // Validate the token
    if (handshake.qr_token !== token) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
    }

    if (handshake.qr_token_used) {
      return NextResponse.json({ error: 'This QR code has already been used' }, { status: 400 })
    }

    if (handshake.qr_token_expires_at && new Date(handshake.qr_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'QR code has expired — ask the seller to generate a new one' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()
    const now = new Date().toISOString()

    // Mark handshake as completed (atomic update)
    const { error: completeError } = await serviceSupabase
      .from('safe_handshakes')
      .update({
        status: 'completed',
        qr_token_used: true,
        completed_at: now,
      })
      .eq('id', id)
      .eq('qr_token_used', false) // extra guard to prevent double-scan race condition

    if (completeError) {
      console.error('Failed to complete handshake:', completeError)
      return NextResponse.json({ error: 'Failed to complete transaction' }, { status: 500 })
    }

    // Check for a pending Stripe order (manual capture escrow)
    const { data: stripeOrder } = await serviceSupabase
      .from('orders')
      .select('id, stripe_payment_intent_id, amount_cents')
      .eq('buyer_id', handshake.buyer_id)
      .eq('listing_id', handshake.listing_id)
      .eq('status', 'pending')
      .eq('payment_method', 'stripe')
      .maybeSingle()

    if (stripeOrder?.stripe_payment_intent_id) {
      // Capture the authorized Stripe payment — buyer is now charged
      await stripeClient.paymentIntents.capture(stripeOrder.stripe_payment_intent_id)

      // Mark the existing Stripe order as completed
      await serviceSupabase.from('orders').update({
        status: 'completed',
        completed_at: now,
      }).eq('id', stripeOrder.id)

      // Mark listing as sold
      await serviceSupabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', handshake.listing_id)
    } else {
      // No Stripe order — cash/Venmo meetup. Fetch price and record in orders.
      const { data: listing } = await serviceSupabase
        .from('listings')
        .select('price')
        .eq('id', handshake.listing_id)
        .single()

      await serviceSupabase.from('listings').update({ status: 'sold' }).eq('id', handshake.listing_id)

      await serviceSupabase.from('orders').insert({
        buyer_id: handshake.buyer_id,
        seller_id: handshake.seller_id,
        listing_id: handshake.listing_id,
        amount_cents: listing?.price ?? 0,
        currency: 'usd',
        platform_fee_cents: 0,
        seller_amount_cents: listing?.price ?? 0,
        status: 'completed',
        payment_method: 'in_person',
        completed_at: now,
      })
    }

    // Increment seller's total_sales count
    const { data: sellerData } = await serviceSupabase
      .from('users')
      .select('total_sales')
      .eq('id', handshake.seller_id)
      .single()
    await serviceSupabase
      .from('users')
      .update({ total_sales: (sellerData?.total_sales ?? 0) + 1 })
      .eq('id', handshake.seller_id)

    return NextResponse.json({ success: true, completedAt: now })
  } catch (err) {
    console.error('Scan QR error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
