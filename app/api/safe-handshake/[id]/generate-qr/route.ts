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

    // Only the seller can generate the QR
    if (user.id !== handshake.seller_id) {
      return NextResponse.json({ error: 'Only the seller can generate the QR code' }, { status: 403 })
    }

    // Must be at both_arrived stage
    if (handshake.status !== 'both_arrived' && handshake.status !== 'qr_generated') {
      return NextResponse.json(
        { error: 'Both parties must be at a Safe-Point before generating the QR code' },
        { status: 400 }
      )
    }

    // Generate a new one-time token (cryptographically random)
    const token = crypto.randomUUID()
    const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    const serviceSupabase = await createServiceClient()
    const { error: updateError } = await serviceSupabase
      .from('safe_handshakes')
      .update({
        qr_token: token,
        qr_token_expires_at: tokenExpiry,
        qr_token_used: false,
        status: 'qr_generated',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to generate QR token:', updateError)
      return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
    }

    return NextResponse.json({ token, expiresAt: tokenExpiry })
  } catch (err) {
    console.error('Generate QR error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
