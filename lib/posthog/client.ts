import posthog from 'posthog-js'

let initialized = false

/**
 * Initialize PostHog (client-side only). No-op if the key isn't set, so the
 * app runs fine in environments without analytics configured.
 *
 * Session replay is on by default once enabled in the PostHog project
 * settings; autocapture records clicks/pageviews automatically so funnels
 * and replays work with minimal manual instrumentation.
 */
export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // captured manually on route change in PostHogProvider
    autocapture: true,
    disable_session_recording: false,
  })
  initialized = true
}

export function posthogEnabled() {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY
}

export { posthog }
