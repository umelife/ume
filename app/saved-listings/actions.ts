'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveListing(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: user.id, listing_id: listingId })

  if (error && error.code !== '23505') return { error: error.message }
  return {}
}

export async function unsaveListing(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) return { error: error.message }
  return {}
}

export async function getSavedListingIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)

  return (data ?? []).map(r => r.listing_id)
}
