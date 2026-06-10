'use client'

import { useEffect } from 'react'

/**
 * Remembers a referral code from the URL (?ref=<username>) so it can be
 * attributed when the visitor later signs up. Mounted once in the root layout
 * so it runs on whatever page the coded link lands on. Reads from
 * window.location directly to avoid a useSearchParams Suspense boundary.
 */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref')
      if (ref) localStorage.setItem('ume_ref', ref.slice(0, 64))
    } catch {
      /* localStorage unavailable — ignore */
    }
  }, [])

  return null
}
