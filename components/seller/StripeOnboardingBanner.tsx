'use client'

/**
 * StripeOnboardingBanner
 *
 * Shown on the seller's profile page when they have listings that require
 * Stripe (shipping or Stripe in-person payment) but haven't completed onboarding.
 *
 * Also shown after returning from Stripe with a status message.
 */

import { useState } from 'react'

interface Props {
  /** Whether the seller has already completed Stripe onboarding */
  isConnected: boolean
  /** URL search param value after returning from Stripe (?stripe=connected|incomplete|error) */
  stripeReturnStatus?: string | null
}

export default function StripeOnboardingBanner({ isConnected, stripeReturnStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show a success message after completing onboarding
  if (isConnected) {
    if (stripeReturnStatus === 'connected') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">Stripe connected!</p>
            <p className="text-sm text-green-700 mt-0.5">
              You can now accept Stripe payments and offer shipping on your listings.
            </p>
          </div>
        </div>
      )
    }
    // Already connected, no banner needed
    return null
  }

  // Show an incomplete/error message if they returned from Stripe without finishing
  const returnMessage =
    stripeReturnStatus === 'incomplete'
      ? "You didn't finish Stripe setup. Complete it to accept online payments and offer shipping."
      : stripeReturnStatus === 'error'
      ? 'Something went wrong with Stripe setup. Please try again.'
      : null

  const handleStartOnboarding = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call the onboard endpoint to get the Stripe-hosted onboarding URL
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start onboarding')
      }

      // Redirect the seller to Stripe's hosted onboarding form
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Stripe icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900">Set up Stripe to accept payments</p>
          <p className="text-sm text-amber-800 mt-0.5">
            {returnMessage ||
              'Connect with Stripe to accept card payments and offer shipping on your listings. Stripe handles all identity verification — we never see your bank or SSN details.'}
          </p>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          <button
            onClick={handleStartOnboarding}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to Stripe...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Set up Stripe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
