'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(input: {
  community_id: string
  title: string
  description?: string
  cover_image_url?: string
  starts_at: string
  ends_at?: string
  location_type: 'in_person' | 'virtual' | 'hybrid'
  location_address?: string
  city?: string
  state?: string
  max_attendees?: number
}): Promise<{ id?: string; error?: string; requiresPayment?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!input.title?.trim()) return { error: 'Title is required' }
  if (!input.starts_at) return { error: 'Start time is required' }

  const startsAt = new Date(input.starts_at)
  if (Number.isNaN(startsAt.getTime())) return { error: 'Invalid start time' }
  if (startsAt < new Date()) return { error: 'Event must be in the future' }

  // Check subscription for non-student accounts
  const accountType = user.user_metadata?.account_type ?? 'student'
  if (accountType !== 'student') {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    if (profile?.subscription_status !== 'active') {
      return { requiresPayment: true, error: 'Subscription required to host events' }
    }
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      community_id: input.community_id,
      creator_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      cover_image_url: input.cover_image_url || null,
      starts_at: input.starts_at,
      ends_at: input.ends_at || null,
      location_type: input.location_type,
      location_address: input.location_address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      max_attendees: input.max_attendees || null,
      status: 'scheduled',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Students need to pay per-event — return id so client can start checkout
  if (accountType === 'student') {
    return { id: data.id, requiresPayment: true }
  }

  revalidatePath('/events')
  revalidatePath(`/communities`)
  return { id: data.id }
}

export async function rsvpEvent(
  eventId: string,
  status: 'going' | 'interested',
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check max_attendees cap for 'going'
  if (status === 'going') {
    const { data: evt } = await supabase
      .from('events')
      .select('max_attendees, rsvp_count')
      .eq('id', eventId)
      .single()
    if (evt?.max_attendees && evt.rsvp_count >= evt.max_attendees) {
      return { error: 'This event is full' }
    }
  }

  const { error } = await supabase
    .from('event_rsvps')
    .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' })
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return {}
}

export async function cancelRsvp(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return {}
}

export async function cancelEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: evt } = await supabase
    .from('events')
    .select('creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evt) return { error: 'Event not found' }
  if (evt.creator_id !== user.id) return { error: 'Only the creator can cancel this event' }
  if (evt.status === 'cancelled') return { error: 'Already cancelled' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/events')
  return {}
}
