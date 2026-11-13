import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100'
const testPort = Number(new URL(baseURL).port || 3100)

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // The email tests share a local log; keep their setup and assertions ordered.
  fullyParallel: false,
  timeout: 90000,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* One worker prevents concurrent access to the shared email test log. */
  workers: 1,

  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testMatch: /marketplace-ui\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${testPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      UME_DIST_DIR: '.next-playwright',
      // Use test environment variables
      BREVO_API_KEY: 'test-api-key',
      BREVO_SENDER_EMAIL: 'umelife.official@gmail.com',
      BREVO_SENDER_NAME: 'UME Marketplace',
      SUPPORT_EMAIL: 'test@example.com',
      // Enable test mode for email mocking
      EMAIL_TEST_MODE: 'true',
    },
  },
})
