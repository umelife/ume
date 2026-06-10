import mixpanel from 'mixpanel-browser'
import { initPostHog, posthog, posthogEnabled } from '@/lib/posthog/client'

let initialized = false

export function initMixpanel() {
  if (!initialized && typeof window !== 'undefined') {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    if (token) {
      mixpanel.init(token, {
        track_pageview: true,
        persistence: 'localStorage',
      })
      initialized = true
    }
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    initMixpanel()
    mixpanel.track(eventName, properties)

    initPostHog()
    if (posthogEnabled()) posthog.capture(eventName, properties)
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    initMixpanel()
    mixpanel.identify(userId)
    if (properties) {
      mixpanel.people.set(properties)
    }

    initPostHog()
    if (posthogEnabled()) posthog.identify(userId, properties)
  }
}

export { mixpanel }
