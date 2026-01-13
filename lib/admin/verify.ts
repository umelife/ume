'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Check if a user has admin privileges
 *
 * @param userId - The user ID to check
 * @returns true if user is an admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

  if (adminEmails.length === 0 || !adminEmails[0]) {
    console.warn('ADMIN_EMAILS not configured in environment variables')
    return false
  }

  const supabase = await createServiceClient()
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (!user?.email) {
    return false
  }

  return adminEmails.includes(user.email)
}

/**
 * Verify current user is an admin, or throw an error
 * Use this in server actions and API routes
 */
export async function verifyAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: Not logged in')
  }

  const hasAdminAccess = await isAdmin(user.id)

  if (!hasAdminAccess) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Get user email from database
  const serviceSupabase = await createServiceClient()
  const { data: userData } = await serviceSupabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    email: userData?.email || ''
  }
}
