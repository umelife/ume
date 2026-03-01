import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sendEmail'

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

    // Notify the seller by email so they know to open the Safe-Handshake link
    try {
      const [sellerResult, buyerResult] = await Promise.all([
        serviceSupabase.from('users').select('email, display_name').eq('id', sellerId).single(),
        serviceSupabase.from('users').select('display_name').eq('id', buyerId).single(),
      ])

      const sellerEmail = sellerResult.data?.email
      const sellerName = sellerResult.data?.display_name ?? 'there'
      const buyerName = buyerResult.data?.display_name ?? 'A buyer'
      const handshakeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/safe-handshake/${handshake.id}`

      if (sellerEmail) {
        await sendEmail({
          to: sellerEmail,
          subject: `${buyerName} wants to meet you for "${listing.title}"`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #312e81; color: white; padding: 28px 30px; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 10px 10px; }
    .info-box { background: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0;font-size:20px;">Safe-Handshake Request</h2>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">UME Campus Marketplace</p>
  </div>
  <div class="content">
    <p>Hi ${sellerName},</p>
    <p><strong>${buyerName}</strong> wants to buy <strong>"${listing.title}"</strong> and has started a Safe-Handshake session to meet you in person at a campus Safe-Point.</p>
    <div class="info-box">
      <strong>What is a Safe-Handshake?</strong><br>
      A GPS-verified in-person exchange at a campus Blue Light station. Both of you head to the same Safe-Point, and UME confirms you're both there before completing the transaction.
    </div>
    <p style="text-align:center;">
      <a href="${handshakeUrl}" class="button">Open Safe-Handshake Session</a>
    </p>
    <p style="color:#666;font-size:13px;">This session expires in 4 hours. If you don't want to proceed, you can ignore this email and the listing will be unlocked automatically.</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} UME Marketplace. All rights reserved.</p>
  </div>
</body>
</html>
          `,
        })
      }
    } catch (emailErr) {
      // Email failure is non-fatal — handshake is already created
      console.error('Failed to send seller Safe-Handshake email:', emailErr)
    }

    return NextResponse.json({ id: handshake.id })
  } catch (err) {
    console.error('Initiate handshake error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
