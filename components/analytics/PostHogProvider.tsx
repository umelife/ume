'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initPostHog, posthog, posthogEnabled } from '@/lib/posthog/client'

/**
 * Initializes PostHog and captures a $pageview on every route change (Next's
 * App Router does client-side navigation, so we capture manually). Uses only
 * usePathname (no useSearchParams) to avoid a Suspense boundary requirement.
 */
export default function PostHogProvider() {
  const pathname = usePathname()

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (pathname && posthogEnabled()) {
      posthog.capture('$pageview')
    }
  }, [pathname])

  return null
}
