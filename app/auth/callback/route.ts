import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? '/reset-password'

  console.log('[Auth Callback] Parameters:', { token_hash: !!token_hash, type, code: !!code, next })

  // Validate next parameter to prevent open redirects - must start with / and not //
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/reset-password'
  }

  if (token_hash && type) {
    const supabase = await createClient()

    // For password recovery, verify the OTP token
    if (type === 'recovery') {
      console.log('[Auth Callback] Verifying OTP for recovery...')
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash,
      })

      if (error) {
        console.error('[Auth Callback] OTP verification error:', error)
      } else {
        console.log('[Auth Callback] OTP verified successfully, redirecting to:', next)
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // Handle PKCE flow with code parameter (newer Supabase flow)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...')
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Code exchange error:', error)
    } else {
      console.log('[Auth Callback] Code exchanged successfully, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no valid parameters, redirect to home
  console.log('[Auth Callback] No valid auth flow, redirecting to home')
  return NextResponse.redirect(new URL('/', request.url))
}
