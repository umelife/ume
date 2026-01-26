/**
 * Client-side utility for calling the admin moderation API
 *
 * Usage:
 *   const result = await callModeration(listingId, 'resolve')
 *   if (result.success) {
 *     console.log('Report resolved:', result.reportId)
 *   } else {
 *     console.error('Error:', result.error)
 *   }
 */

export type ModerationAction = 'resolve' | 'dismiss'

export interface ModerationResult {
  success: boolean
  message?: string
  error?: string
  reportId?: string
  newStatus?: string
}

/**
 * Call the moderation API to resolve or dismiss a report
 *
 * @param listingId - The ID of the listing being moderated
 * @param action - The moderation action: 'resolve' or 'dismiss'
 * @param testToken - Optional test token for ADMIN_TEST_MODE (non-production only)
 * @returns Promise<ModerationResult>
 */
export async function callModeration(
  listingId: string,
  action: ModerationAction,
  testToken?: string
): Promise<ModerationResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add test token if provided (for testing purposes only)
    if (testToken) {
      headers['X-Admin-Test-Token'] = testToken
    }

    const response = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers,
      body: JSON.stringify({ listingId, action }),
    })

    const data: ModerationResult = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error: ${response.status}`,
      }
    }

    return data
  } catch (error) {
    console.error('[callModeration] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get moderation info for a listing (all reports)
 *
 * @param listingId - The ID of the listing
 * @param testToken - Optional test token for ADMIN_TEST_MODE
 * @returns Promise with reports data
 */
export async function getModerationInfo(
  listingId: string,
  testToken?: string
): Promise<{
  success: boolean
  reports?: Array<{
    id: string
    status: string
    reason: string
    created_at: string
    reporter: {
      display_name: string
      email: string
    }
  }>
  count?: number
  error?: string
}> {
  try {
    const headers: Record<string, string> = {}

    if (testToken) {
      headers['X-Admin-Test-Token'] = testToken
    }

    const response = await fetch(`/api/admin/moderation?listingId=${encodeURIComponent(listingId)}`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error: ${response.status}`,
      }
    }

    return data
  } catch (error) {
    console.error('[getModerationInfo] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
