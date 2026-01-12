import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? '/reset-password'

  console.log('[Auth Callback] Parameters:', {
    token_hash: token_hash ? `${token_hash.substring(0, 20)}...` : null,
    type,
    code: !!code,
    next
  })

  // Validate next parameter to prevent open redirects - must start with / and not //
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/reset-password'
  }

  const supabase = await createClient()

  // Handle email link with token_hash
  if (token_hash && type) {
    console.log('[Auth Callback] Processing email link with token_hash, type:', type)

    // For PKCE tokens (starting with "pkce_"), we need to exchange them for a session
    if (token_hash.startsWith('pkce_')) {
      console.log('[Auth Callback] PKCE token detected, exchanging for session')

      // Try exchanging the PKCE token directly
      const { data, error } = await supabase.auth.exchangeCodeForSession(token_hash)

      if (error) {
        console.error('[Auth Callback] PKCE exchange error:', error.message, error)

        // If exchange fails, try verifyOtp as fallback
        console.log('[Auth Callback] Trying verifyOtp as fallback')
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: type as any,
          token_hash,
        })

        if (otpError) {
          console.error('[Auth Callback] OTP verification also failed:', otpError.message)
          const errorUrl = new URL('/forgot-password', request.url)
          errorUrl.searchParams.set('error', 'Invalid or expired reset link. Please request a new one.')
          return NextResponse.redirect(errorUrl)
        }
      }

      console.log('[Auth Callback] Token processed successfully, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      // Standard OTP flow (non-PKCE)
      console.log('[Auth Callback] Standard OTP token, using verifyOtp')
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (error) {
        console.error('[Auth Callback] Token verification error:', error.message, error)
        const errorUrl = new URL('/forgot-password', request.url)
        errorUrl.searchParams.set('error', 'Invalid or expired reset link')
        return NextResponse.redirect(errorUrl)
      } else {
        console.log('[Auth Callback] Token verified successfully, redirecting to:', next)
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // Handle PKCE flow with code parameter (for email confirmations)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Code exchange error:', error)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'Authentication failed')
      return NextResponse.redirect(errorUrl)
    } else {
      console.log('[Auth Callback] Code exchanged successfully, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no valid parameters, redirect to home
  console.log('[Auth Callback] No valid auth parameters, redirecting to home')
  return NextResponse.redirect(new URL('/', request.url))
}
