/**
 * Test-only API endpoint to trigger a test report email
 *
 * Security:
 * - Only available when EMAIL_TEST_MODE=true
 * - Always returns 403 in production (NODE_ENV=production)
 * - Used by Playwright tests to verify email sending without authentication
 *
 * This endpoint allows E2E tests to trigger the sendReportNotification
 * function and verify the email payload without going through the UI.
 */

import { NextResponse } from 'next/server'
import { sendReportNotification } from '@/lib/email/sendEmail'

/**
 * Check if test endpoints should be enabled
 * Returns false in production OR if EMAIL_TEST_MODE is not explicitly 'true'
 */
function isTestModeEnabled(): boolean {
  // Always block in production, regardless of EMAIL_TEST_MODE
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  // In non-production, require explicit EMAIL_TEST_MODE=true
  return process.env.EMAIL_TEST_MODE === 'true'
}

export async function POST(request: Request) {
  if (!isTestModeEnabled()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in test mode (non-production with EMAIL_TEST_MODE=true)' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    const result = await sendReportNotification({
      listingId: body.listingId || 'test-listing-123',
      reportReason: body.reason || 'Test report from E2E test',
      reporterId: body.reporterId || 'test-user-456',
      timestamp: new Date().toISOString(),
    })

    // Note: We only expose non-sensitive env var values for test verification
    // BREVO_API_KEY is never exposed
    return NextResponse.json({
      success: true,
      emailResult: result,
      env: {
        BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'no-reply@ume-life.com',
        SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'umelife.official@gmail.com',
        EMAIL_TEST_MODE: process.env.EMAIL_TEST_MODE,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
