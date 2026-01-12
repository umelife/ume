import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') ?? '/'
  const code = requestUrl.searchParams.get('code')

  console.log('[Auth Callback] Request received:', {
    next,
    hasCode: !!code
  })

  // Validate next parameter to prevent open redirects
  if (!next.startsWith('/') || next.startsWith('//')) {
    console.log('[Auth Callback] Invalid next param, using default')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If there's no code, just redirect (shouldn't happen in normal flow)
  if (!code) {
    console.log('[Auth Callback] No code found, redirecting anyway')
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Create response that will include cookies
  const redirectResponse = NextResponse.redirect(new URL(next, request.url))

  // Create Supabase client with cookie handlers that will set cookies on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('[Auth Callback] Session exchange result:', {
    hasSession: !!data.session,
    hasUser: !!data.user,
    userId: data.user?.id,
    error: error?.message,
    willRedirectTo: next
  })

  if (error) {
    console.error('[Auth Callback] Error during code exchange:', error)
    const errorUrl = new URL('/forgot-password', request.url)
    errorUrl.searchParams.set('error', error.message || 'Authentication failed')
    return NextResponse.redirect(errorUrl)
  }

  if (!data.session || !data.user) {
    console.error('[Auth Callback] No session after code exchange')
    const errorUrl = new URL('/forgot-password', request.url)
    errorUrl.searchParams.set('error', 'Invalid or expired reset link')
    return NextResponse.redirect(errorUrl)
  }

  console.log('[Auth Callback] Successfully authenticated user, redirecting to:', next)
  return redirectResponse
}
