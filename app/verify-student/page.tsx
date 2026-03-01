'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyStudentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      const supabase = createClient()

      // Mark the user as student-verified. Their .edu email was already
      // validated at signup, so this is just completing the flag.
      const { error } = await supabase.auth.updateUser({
        data: { student_verified: true },
      })

      if (error) {
        setError('Something went wrong. Please refresh the page to try again.')
        return
      }

      router.replace('/marketplace')
    }

    verify()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-black">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium underline text-black"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
          <svg
            className="animate-spin h-6 w-6 text-black"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black">Setting up your account…</h2>
        <p className="text-sm text-gray-600">You'll be redirected to the marketplace in a moment.</p>
      </div>
    </div>
  )
}
