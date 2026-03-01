import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import SafeHandshakeClient from './SafeHandshakeClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SafeHandshakePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the handshake (RLS ensures only participants can read it)
  const { data: handshake, error } = await supabase
    .from('safe_handshakes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !handshake) {
    notFound()
  }

  // Check if expired and not yet cancelled
  if (
    new Date(handshake.expires_at) < new Date() &&
    handshake.status !== 'completed' &&
    handshake.status !== 'cancelled'
  ) {
    // Auto-cancel + unlock listing via service role
    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('safe_handshakes')
      .update({ status: 'cancelled' })
      .eq('id', id)
    await serviceSupabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', handshake.listing_id)

    handshake.status = 'cancelled'
  }

  // Fetch listing + seller + buyer info
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, user_id')
    .eq('id', handshake.listing_id)
    .single()

  const { data: seller } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', handshake.seller_id)
    .single()

  const { data: buyer } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', handshake.buyer_id)
    .single()

  // Ensure current user is a participant
  if (user.id !== handshake.seller_id && user.id !== handshake.buyer_id) {
    notFound()
  }

  return (
    <SafeHandshakeClient
      handshake={handshake}
      currentUserId={user.id}
      listingTitle={listing?.title ?? 'Unknown Listing'}
      sellerName={seller?.display_name ?? 'Seller'}
      buyerName={buyer?.display_name ?? 'Buyer'}
    />
  )
}
