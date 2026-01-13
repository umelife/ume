'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Report a conversation/chat for inappropriate content or harassment
 */
export async function reportConversation(
  listingId: string,
  otherUserId: string,
  reason: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Create a report for the conversation
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      listing_id: listingId,
      reason: `Chat Report: ${reason}`,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Send email notification to support team (non-blocking)
  try {
    const { sendReportNotification } = await import('@/lib/email/sendEmail')
    await sendReportNotification({
      listingId,
      reportReason: `Chat Report: ${reason}`,
      reporterId: user.id,
      timestamp: new Date().toISOString(),
    })
  } catch (emailError) {
    console.error('Failed to send chat report notification email:', emailError)
  }

  return { success: true, report: data }
}

/**
 * Delete a conversation (soft delete - marks it as deleted for the user)
 */
export async function deleteConversation(
  listingId: string,
  otherUserId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Normalize participant order
  const [participant1, participant2] = [user.id, otherUserId].sort()

  // Find the conversation
  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('participant_1_id', participant1)
    .eq('participant_2_id', participant2)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!conversation) {
    return { error: 'Conversation not found' }
  }

  // Delete all messages in the conversation
  const { error: deleteMessagesError } = await supabase
    .from('messages')
    .delete()
    .eq('listing_id', listingId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (deleteMessagesError) {
    return { error: deleteMessagesError.message }
  }

  // Delete the conversation
  const { error: deleteConvError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversation.id)

  if (deleteConvError) {
    return { error: deleteConvError.message }
  }

  revalidatePath('/messages')
  return { success: true }
}
