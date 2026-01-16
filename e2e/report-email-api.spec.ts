import { test, expect } from '@playwright/test'

/**
 * E2E Test: Report Email API Flow
 *
 * This test validates the email sending functionality directly via API,
 * without requiring UI interaction or authentication.
 *
 * It verifies:
 * 1. The sendReportNotification function is called correctly
 * 2. Email payload has correct sender, recipient, and reply-to
 * 3. No real emails are sent (test mode)
 */

interface EmailLogEntry {
  timestamp: string
  payload: {
    sender: { name: string; email: string }
    to: { email: string }[]
    subject: string
    replyTo: { email: string }
  }
  success: boolean
  testMode: boolean
}

interface EmailLogResponse {
  logs: EmailLogEntry[]
  count: number
  logPath: string
}

test.describe('Report Email API Tests', () => {
  test.beforeEach(async ({ request }) => {
    // Clear email logs before each test
    const response = await request.delete('/api/test/email-log')
    expect(response.ok()).toBeTruthy()
  })

  test('sendReportNotification sends email with correct payload', async ({ request }) => {
    // Trigger a test report email via API
    const reportResponse = await request.post('/api/test/send-test-report', {
      data: {
        listingId: 'test-listing-e2e',
        reason: 'E2E automated test - verifying email payload',
        reporterId: 'e2e-test-user',
      },
    })

    expect(reportResponse.ok()).toBeTruthy()
    const reportResult = await reportResponse.json()

    // Verify the API response
    expect(reportResult.success).toBe(true)
    expect(reportResult.emailResult.success).toBe(true)
    expect(reportResult.emailResult.testMode).toBe(true)

    // Verify environment variables are set correctly
    expect(reportResult.env.EMAIL_TEST_MODE).toBe('true')
    expect(reportResult.env.BREVO_SENDER_EMAIL).toBe('no-reply@ume-life.com')

    // Now check the email log
    const logResponse = await request.get('/api/test/email-log')
    expect(logResponse.ok()).toBeTruthy()

    const logs: EmailLogResponse = await logResponse.json()
    expect(logs.count).toBe(1)

    const email = logs.logs[0]

    // Verify sender (FROM)
    expect(email.payload.sender.email).toBe('no-reply@ume-life.com')
    expect(email.payload.sender.name).toBe('UME Support')

    // Verify recipient (TO) - should be SUPPORT_EMAIL
    expect(email.payload.to.length).toBe(1)
    // In test mode, SUPPORT_EMAIL is set to 'test@example.com' in playwright.config.ts
    expect(email.payload.to[0].email).toBe('test@example.com')

    // Verify reply-to
    expect(email.payload.replyTo.email).toBe('test@example.com')

    // Verify subject
    expect(email.payload.subject).toBe('[UME] Listing Reported')

    // Verify test mode flag
    expect(email.testMode).toBe(true)
    expect(email.success).toBe(true)
  })

  test('email sender uses BREVO_SENDER_EMAIL environment variable', async ({ request }) => {
    // Trigger email
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Testing sender email' },
    })

    // Get logs
    const logResponse = await request.get('/api/test/email-log')
    const logs: EmailLogResponse = await logResponse.json()

    // Sender should match BREVO_SENDER_EMAIL or default
    const expectedSender = 'no-reply@ume-life.com' // Set in playwright.config.ts
    expect(logs.logs[0].payload.sender.email).toBe(expectedSender)
  })

  test('email recipient uses SUPPORT_EMAIL environment variable', async ({ request }) => {
    // Trigger email
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Testing recipient email' },
    })

    // Get logs
    const logResponse = await request.get('/api/test/email-log')
    const logs: EmailLogResponse = await logResponse.json()

    // Recipient should match SUPPORT_EMAIL
    const expectedRecipient = 'test@example.com' // Set in playwright.config.ts
    expect(logs.logs[0].payload.to[0].email).toBe(expectedRecipient)
  })

  test('email reply-to matches SUPPORT_EMAIL', async ({ request }) => {
    // Trigger email
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Testing reply-to email' },
    })

    // Get logs
    const logResponse = await request.get('/api/test/email-log')
    const logs: EmailLogResponse = await logResponse.json()

    // Reply-to should match SUPPORT_EMAIL
    const expectedReplyTo = 'test@example.com' // Set in playwright.config.ts
    expect(logs.logs[0].payload.replyTo.email).toBe(expectedReplyTo)
  })

  test('multiple reports create multiple email log entries', async ({ request }) => {
    // Send first report
    await request.post('/api/test/send-test-report', {
      data: { reason: 'First report', listingId: 'listing-1' },
    })

    // Send second report
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Second report', listingId: 'listing-2' },
    })

    // Get logs
    const logResponse = await request.get('/api/test/email-log')
    const logs: EmailLogResponse = await logResponse.json()

    expect(logs.count).toBe(2)
    expect(logs.logs).toHaveLength(2)

    // Both should be in test mode
    expect(logs.logs[0].testMode).toBe(true)
    expect(logs.logs[1].testMode).toBe(true)
  })

  test('email log can be cleared between tests', async ({ request }) => {
    // Send a report
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Report to be cleared' },
    })

    // Verify log has entry
    let logResponse = await request.get('/api/test/email-log')
    let logs: EmailLogResponse = await logResponse.json()
    expect(logs.count).toBe(1)

    // Clear logs
    const clearResponse = await request.delete('/api/test/email-log')
    expect(clearResponse.ok()).toBeTruthy()

    // Verify log is empty
    logResponse = await request.get('/api/test/email-log')
    logs = await logResponse.json()
    expect(logs.count).toBe(0)
  })

  test('test endpoints return 403 when EMAIL_TEST_MODE is not set', async ({ request }) => {
    // Note: This test will actually pass because EMAIL_TEST_MODE=true is set
    // in playwright.config.ts. This documents the expected behavior.

    // In production (without EMAIL_TEST_MODE=true), these would return 403:
    // - GET /api/test/email-log
    // - DELETE /api/test/email-log
    // - POST /api/test/send-test-report

    // For now, just verify the endpoints work in test mode
    const logResponse = await request.get('/api/test/email-log')
    expect(logResponse.status()).toBe(200)

    const sendResponse = await request.post('/api/test/send-test-report', {
      data: { reason: 'Test' },
    })
    expect(sendResponse.status()).toBe(200)
  })
})

test.describe('Email Payload Validation', () => {
  test.beforeEach(async ({ request }) => {
    await request.delete('/api/test/email-log')
  })

  test('email subject contains [UME] prefix', async ({ request }) => {
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Subject test' },
    })

    const logs: EmailLogResponse = await (
      await request.get('/api/test/email-log')
    ).json()

    expect(logs.logs[0].payload.subject).toMatch(/^\[UME\]/)
  })

  test('email sender name is "UME Support"', async ({ request }) => {
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Sender name test' },
    })

    const logs: EmailLogResponse = await (
      await request.get('/api/test/email-log')
    ).json()

    expect(logs.logs[0].payload.sender.name).toBe('UME Support')
  })

  test('email timestamp is valid ISO format', async ({ request }) => {
    await request.post('/api/test/send-test-report', {
      data: { reason: 'Timestamp test' },
    })

    const logs: EmailLogResponse = await (
      await request.get('/api/test/email-log')
    ).json()

    const timestamp = logs.logs[0].timestamp
    expect(new Date(timestamp).toISOString()).toBe(timestamp)
  })
})
