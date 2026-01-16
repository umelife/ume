/**
 * Test-only API endpoint to read/clear email logs
 *
 * Security:
 * - Only available when EMAIL_TEST_MODE=true
 * - Always returns 403 in production (NODE_ENV=production)
 * - Used by Playwright tests to verify email sending
 */

import { NextResponse } from 'next/server'
import { readEmailTestLog, clearEmailTestLog, getEmailTestLogPath } from '@/lib/email/sendEmail'

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

export async function GET() {
  if (!isTestModeEnabled()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in test mode (non-production with EMAIL_TEST_MODE=true)' },
      { status: 403 }
    )
  }

  const logs = readEmailTestLog()
  return NextResponse.json({
    logs,
    count: logs.length,
    logPath: getEmailTestLogPath(),
  })
}

export async function DELETE() {
  if (!isTestModeEnabled()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in test mode (non-production with EMAIL_TEST_MODE=true)' },
      { status: 403 }
    )
  }

  clearEmailTestLog()
  return NextResponse.json({ success: true, message: 'Email test log cleared' })
}
