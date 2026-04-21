'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { reauthenticate } from '@/lib/auth/actions'

/**
 * /reauth — Annual reauthentication gate.
 *
 * Shown when a user's last_reauthenticated_at timestamp is > 1 year old.
 * They must re-enter their password to continue. On success the timestamp
 * is refreshed and they are redirected to the page they were trying to visit.
 */
function ReauthForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/marketplace'

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('next', next)

    const result = await reauthenticate(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, reauthenticate() calls redirect() server-side — no client handling needed
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ume-indigo/30 focus:border-ume-indigo transition"
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-ume-indigo text-white font-semibold text-sm rounded-xl hover:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Verifying…' : 'Continue'}
      </button>
    </form>
  )
}

export default function ReauthPage() {
  return (
    <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / heading */}
        <div className="text-center mb-8">
          <p className="font-[family:var(--font-archivo-black)] text-4xl tracking-tight mb-3">
            <span className="text-ume-indigo">U</span>
            <span className="text-ume-pink">ME</span>
          </p>
          <h1 className="font-[family:var(--font-archivo-black)] text-xl uppercase tracking-tight text-ume-indigo">
            Confirm your password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            For your security, please re-enter your password.<br />
            We ask once per year.
          </p>
        </div>

        {/* Form — useSearchParams requires Suspense */}
        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center h-32">
            <span className="w-5 h-5 border-2 border-ume-indigo/30 border-t-ume-indigo rounded-full animate-spin" />
          </div>
        }>
          <ReauthForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400 mt-4">
          This is a security check, not a session expiry.
        </p>
      </div>
    </div>
  )
}
