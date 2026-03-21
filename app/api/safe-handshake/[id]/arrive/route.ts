import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripeClient } from '@/lib/stripe/client'
import { SAFE_POINTS } from '@/data/safe-points'

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

    const { safePointId } = await request.json()

    if (!safePointId) {
      return NextResponse.json({ error: 'safePointId is required' }, { status: 400 })
    }

    // Validate it's a real Safe-Point ID (not a fake placeholder)
    if (!SAFE_POINTS.find((p) => p.id === safePointId)) {
      return NextResponse.json({ error: 'Invalid safePointId' }, { status: 400 })
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

      // Void any pending Stripe authorization
      const { data: pendingOrder } = await serviceSupabase
        .from('orders')
        .select('id, stripe_payment_intent_id')
        .eq('buyer_id', handshake.buyer_id)
        .eq('listing_id', handshake.listing_id)
        .eq('status', 'pending')
        .eq('payment_method', 'stripe')
        .maybeSingle()
      if (pendingOrder?.stripe_payment_intent_id) {
        await stripeClient.paymentIntents.cancel(pendingOrder.stripe_payment_intent_id).catch(() => null)
        await serviceSupabase.from('orders').update({ status: 'cancelled' }).eq('id', pendingOrder.id)
      }

      return NextResponse.json({ error: 'Session has expired' }, { status: 410 })
    }

    // Check participant
    const isSeller = user.id === handshake.seller_id
    const isBuyer = user.id === handshake.buyer_id
    if (!isSeller && !isBuyer) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Check terminal states
    if (['completed', 'cancelled'].includes(handshake.status)) {
      return NextResponse.json({ error: 'Session is already finished' }, { status: 409 })
    }

    // If a location was pre-agreed in chat, validate the person goes to the right place
    if (handshake.safe_point_id && safePointId !== handshake.safe_point_id) {
      const agreedPoint = SAFE_POINTS.find((p) => p.id === handshake.safe_point_id)
      return NextResponse.json(
        { error: `Please go to ${agreedPoint?.name ?? 'the agreed Safe-Point'} — that's where you both agreed to meet.` },
        { status: 400 }
      )
    }

    const serviceSupabase = await createServiceClient()
    const now = new Date().toISOString()

    // Determine new status
    const otherArrived = isSeller
      ? handshake.buyer_arrived_at !== null
      : handshake.seller_arrived_at !== null

    let newStatus: string
    let updateFields: Record<string, unknown>

    if (isSeller) {
      // If buyer already arrived at a different point, still record seller's arrival
      const bothAtSame = otherArrived && (handshake.safe_point_id === safePointId || !handshake.safe_point_id)
      newStatus = bothAtSame ? 'both_arrived' : 'seller_arrived'
      updateFields = {
        seller_arrived_at: now,
        // Only set safe_point_id if not already pre-agreed (don't overwrite the agreed location)
        ...(handshake.safe_point_id ? {} : { safe_point_id: safePointId }),
        status: newStatus,
      }
    } else {
      // Buyer arrives
      const sellerSafePoint = handshake.safe_point_id
      const sellerArrived = handshake.seller_arrived_at !== null
      const bothAtSame = sellerArrived && sellerSafePoint === safePointId
      newStatus = bothAtSame ? 'both_arrived' : 'buyer_arrived'
      updateFields = {
        buyer_arrived_at: now,
        status: newStatus,
        // Only update safe_point_id if not already set (seller sets it first usually)
        ...(handshake.safe_point_id ? {} : { safe_point_id: safePointId }),
      }
    }

    const { error: updateError } = await serviceSupabase
      .from('safe_handshakes')
      .update(updateFields)
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update arrival:', updateError)
      return NextResponse.json({ error: 'Failed to record arrival' }, { status: 500 })
    }

    return NextResponse.json({ status: newStatus, safePointId })
  } catch (err) {
    console.error('Arrive error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
