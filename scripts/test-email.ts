/**
 * Test script to verify Brevo email sending
 *
 * Usage:
 *   npx tsx scripts/test-email.ts
 *
 * Prerequisites:
 *   - BREVO_API_KEY set in .env.local
 *   - BREVO_SENDER_EMAIL verified in Brevo (or defaults to no-reply@ume-life.com)
 *   - SUPPORT_EMAIL set to receiving Gmail address
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testEmail() {
  console.log('='.repeat(60))
  console.log('Brevo Email Test')
  console.log('='.repeat(60))

  // Check env vars
  console.log('\nEnvironment Variables:')
  console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✓ Set' : '✗ Not set')
  console.log('  BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || '(default: no-reply@ume-life.com)')
  console.log('  SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL || '(default: umelife.official@gmail.com)')

  if (!process.env.BREVO_API_KEY) {
    console.error('\n❌ Error: BREVO_API_KEY is not set in .env.local')
    process.exit(1)
  }

  // Import the email function (after env vars are loaded)
  const { sendReportNotification } = await import('../lib/email/sendEmail')

  console.log('\nSending test report notification email...')
  console.log('-'.repeat(60))

  const result = await sendReportNotification({
    listingId: 'test-listing-123',
    reportReason: 'Test report - verifying Brevo email integration',
    reporterId: 'test-user-456',
    timestamp: new Date().toISOString(),
  })

  console.log('-'.repeat(60))
  console.log('\nResult:')
  console.log(JSON.stringify(result, null, 2))

  if (result.success) {
    console.log('\n✅ Email sent successfully!')
    console.log('   Check your inbox at:', process.env.SUPPORT_EMAIL || 'umelife.official@gmail.com')
  } else {
    console.log('\n❌ Email failed to send')
    console.log('   Error:', result.error)
  }

  console.log('\n' + '='.repeat(60))
}

testEmail().catch(console.error)
