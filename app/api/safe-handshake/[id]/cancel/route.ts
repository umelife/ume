import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: handshake } = await supabase
      .from('safe_handshakes')
      .select('id, seller_id, buyer_id, listing_id, status')
      .eq('id', id)
      .single()

    if (!handshake) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (user.id !== handshake.seller_id && user.id !== handshake.buyer_id) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    if (['completed', 'cancelled'].includes(handshake.status)) {
      return NextResponse.json({ error: 'Session is already finished' }, { status: 409 })
    }

    const serviceSupabase = await createServiceClient()

    await serviceSupabase
      .from('safe_handshakes')
      .update({ status: 'cancelled' })
      .eq('id', id)

    await serviceSupabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', handshake.listing_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
