'use client'

import { signIn } from '@/lib/auth/actions'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Your password has been reset successfully. You can now log in with your new password.')
    }
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f7f8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-xl">

        {/* Left brand panel — hidden on mobile */}
        <div
          className="hidden md:flex flex-col justify-between w-[45%] p-10"
          style={{ backgroundColor: '#130170' }}
        >
          <div>
            {/* UME logotype */}
            <div className="text-4xl font-extrabold tracking-tight">
              <span className="text-white">U</span>
              <span style={{ color: '#fa9ebc' }}>ME</span>
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: '#fa9ebc' }}>
              University Marketplace Exchange
            </p>
          </div>

          <div className="space-y-6">
            <blockquote className="text-white/90 text-lg font-medium leading-snug">
              "Buy, sell, and trade with students at your campus — all in one place."
            </blockquote>
            <div className="flex gap-2">
              <div className="h-1 w-8 rounded-full" style={{ backgroundColor: '#fa9ebc' }} />
              <div className="h-1 w-4 rounded-full bg-white/30" />
              <div className="h-1 w-4 rounded-full bg-white/30" />
            </div>
          </div>

          <p className="text-white/40 text-xs">© {new Date().getFullYear()} UME. All rights reserved.</p>
        </div>

        {/* Right form panel */}
        <Card className="flex-1 rounded-none border-0 shadow-none bg-white">
          <CardHeader className="pt-10 pb-4 px-8">
            {/* Mobile logo */}
            <div className="md:hidden text-center mb-2">
              <span className="text-3xl font-extrabold" style={{ color: '#130170' }}>U</span>
              <span className="text-3xl font-extrabold" style={{ color: '#fa9ebc' }}>ME</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Sign in to your UME account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form action={handleSubmit} className="space-y-5">

              {successMessage && (
                <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Username or Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  required
                  placeholder="Enter username or email"
                  className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#130170' }}
              >
                {loading ? 'Signing in…' : 'Log in'}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400">OR</span>
                <Separator className="flex-1" />
              </div>

              <p className="text-center text-sm text-gray-600">
                Need an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold transition-colors hover:opacity-80"
                  style={{ color: '#130170' }}
                >
                  Sign up
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f3f7f8] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
