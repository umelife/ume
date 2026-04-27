'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'umeStripeBannerDismissed'

export default function StripeSetupBannerClient() {
  const [dismissed, setDismissed] = useState(true) // start dismissed; reveal after localStorage check
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISS_KEY) !== '1') setDismissed(false)
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  if (dismissed) return null

  const handleSetup = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="text-sm font-medium truncate">
          {error ?? 'Set up Stripe to accept card payments and offer shipping on your listings'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleSetup}
          disabled={loading}
          className="bg-white text-amber-700 font-semibold text-sm px-3 py-1 rounded-full hover:bg-amber-50 transition-colors disabled:opacity-70 whitespace-nowrap"
        >
          {loading ? 'Setting up...' : 'Set up now →'}
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white p-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
