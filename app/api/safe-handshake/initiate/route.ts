import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Fetch the listing to determine seller
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title, status')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'This listing has already been sold' }, { status: 409 })
    }

    if (listing.status === 'reserved') {
      return NextResponse.json({ error: 'This listing is already reserved for another handshake' }, { status: 409 })
    }

    const sellerId = listing.user_id
    const buyerId = user.id === sellerId ? null : user.id

    // Ensure the current user is either the seller or a buyer (not the owner acting as buyer)
    if (user.id === sellerId) {
      return NextResponse.json(
        { error: 'You cannot start a Safe-Handshake for your own listing' },
        { status: 400 }
      )
    }

    // Check if an active handshake already exists for this listing+buyer pair
    const { data: existing } = await supabase
      .from('safe_handshakes')
      .select('id, status')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .not('status', 'in', '(completed,cancelled)')
      .maybeSingle()

    if (existing) {
      // Return the existing active session instead of creating a duplicate
      return NextResponse.json({ id: existing.id, existing: true })
    }

    const serviceSupabase = await createServiceClient()

    // Create the handshake session
    const { data: handshake, error: createError } = await serviceSupabase
      .from('safe_handshakes')
      .insert({
        listing_id: listingId,
        seller_id: sellerId,
        buyer_id: buyerId,
        status: 'initiated',
      })
      .select('id')
      .single()

    if (createError || !handshake) {
      console.error('Failed to create handshake:', createError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Reserve the listing so other buyers cannot start a new handshake
    await serviceSupabase
      .from('listings')
      .update({ status: 'reserved' })
      .eq('id', listingId)

    return NextResponse.json({ id: handshake.id })
  } catch (err) {
    console.error('Initiate handshake error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
