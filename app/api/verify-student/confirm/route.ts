import { createClient, createBackgroundServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/verify-student/confirm
 *
 * Called by the verify-student page after SheerID succeeds (or test mode button).
 * Uses the service role client to update the user's metadata so the middleware
 * immediately allows them through on the next request.
 */
export async function POST() {
  // Get the current user from their session cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to update user metadata (service role bypasses RLS)
  const adminClient = createBackgroundServiceClient()
  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      student_verified: true,
    },
  })

  if (error) {
    console.error('Failed to mark student verified:', error)
    return NextResponse.json({ error: 'Verification update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
