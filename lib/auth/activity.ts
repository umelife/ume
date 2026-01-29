/**
 * User Activity Tracking
 * Updates the user's last_active timestamp for presence detection
 *
 * Used for:
 * - Determining if user is "active" to skip email notifications
 * - General activity tracking/analytics
 *
 * The database function has built-in debouncing (1 minute)
 * to avoid excessive writes.
 */

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Update user's last_active timestamp
 * Uses database function with built-in debounce (1 minute)
 * Fire-and-forget - doesn't block the request
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const supabase = await createServiceClient()

    // Call database function - it handles debouncing internally
    const { error } = await supabase.rpc('update_user_activity', {
      p_user_id: userId
    })

    if (error) {
      // Log but don't throw - activity tracking shouldn't break the app
      console.error('[Activity] Failed to update user activity:', error.message)
    }
  } catch (error) {
    // Silently fail - this is non-critical
    console.error('[Activity] Exception updating user activity:', error)
  }
}

/**
 * Check if a user is currently active
 * @param userId - User ID to check
 * @param thresholdMinutes - Consider active if seen within this many minutes (default: 5)
 */
export async function isUserActive(
  userId: string,
  thresholdMinutes: number = 5
): Promise<boolean> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase.rpc('is_user_active', {
      p_user_id: userId,
      p_threshold_minutes: thresholdMinutes
    })

    if (error) {
      console.error('[Activity] Failed to check user activity:', error.message)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[Activity] Exception checking user activity:', error)
    return false
  }
}
