'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Student Verification Page
 *
 * New users land here after email confirmation + login.
 * Existing users (student_verified = undefined) are never sent here.
 *
 * TEST MODE  — no NEXT_PUBLIC_SHEERID_PROGRAM_ID set:
 *   Shows a "Simulate Verification" button. Use this to test the full flow locally.
 *
 * PRODUCTION — NEXT_PUBLIC_SHEERID_PROGRAM_ID is set:
 *   Loads the SheerID widget. On success, calls /api/verify-student/confirm
 *   and redirects to /marketplace.
 *
 * To go live:
 *   1. Sign up at sheerid.com and create a "Student" verification program
 *   2. Add NEXT_PUBLIC_SHEERID_PROGRAM_ID=<your-program-id> to Vercel env vars
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SheerID: any
  }
}

export default function VerifyStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ready, setReady]     = useState(false)

  const programId  = process.env.NEXT_PUBLIC_SHEERID_PROGRAM_ID
  const isTestMode = !programId

  // Guard: redirect if not logged in or already verified
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      if (user.user_metadata?.student_verified !== false) { router.replace('/marketplace'); return }
      setReady(true)
    })
  }, [router])

  // Load SheerID widget in production mode
  useEffect(() => {
    if (!ready || isTestMode) return

    const script = document.createElement('script')
    script.src = 'https://cdn.sheerid.com/jsapi/1/sheerid.js'
    script.async = true
    script.onload = () => {
      const SheerID = window.SheerID
      if (!SheerID) return
      SheerID.load(programId, '#sheerid-widget', {})
      SheerID.addEventHandler(SheerID.VERIFICATION_SUCCESS, () => {
        markVerified()
      })
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [ready, programId, isTestMode])

  const markVerified = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/verify-student/confirm', { method: 'POST' })
      if (!res.ok) throw new Error('Verification failed')

      // Refresh the session so middleware picks up the new metadata immediately
      const supabase = createClient()
      await supabase.auth.refreshSession()

      router.replace('/marketplace')
    } catch {
      setLoading(false)
      alert('Something went wrong. Please try again.')
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-ume-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ume-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ume-cream flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ume-indigo rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-ume-indigo mb-2">One Last Step</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            UME is exclusively for college students. A quick verification keeps our community safe and trusted.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          {isTestMode ? (
            /* ── Test mode ── */
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium mb-5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Test Mode — SheerID not configured
              </div>

              <p className="text-sm text-gray-600 mb-6">
                In production, students verify here using SheerID (National Student Clearinghouse).
                Click below to simulate a successful verification and test the full flow.
              </p>

              <button
                onClick={markVerified}
                disabled={loading}
                className="w-full py-3 bg-ume-indigo text-white rounded-full font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  '✓ Simulate Student Verification'
                )}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                To activate real verification, add{' '}
                <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SHEERID_PROGRAM_ID</code>{' '}
                to your environment variables.
              </p>
            </div>
          ) : (
            /* ── Production: SheerID widget ── */
            <div>
              <div id="sheerid-widget" className="min-h-[320px]" />
              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <span className="w-4 h-4 border-2 border-ume-indigo border-t-transparent rounded-full animate-spin" />
                  Completing verification...
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Verification is powered by SheerID. Your data is never stored by UME.
        </p>
      </div>
    </div>
  )
}
