import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Public routes that don't need session updates or auth checks
  // Note: /reset-password needs session updates to verify the reset token
  const publicPaths = ['/forgot-password', '/login', '/signup', '/verify-student', '/reauth']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Update session for all other routes (including /auth/callback and /reset-password)
  // This is where Supabase will handle PKCE code exchange and session creation
  const response = await updateSession(request)

  // Check authentication for protected routes
  const protectedPaths = ['/marketplace', '/create', '/profile', '/admin', '/messages', '/edit', '/safe-handshake']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Create a new response to avoid mutating the request
    let supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect new users who haven't completed student verification.
    // Existing users have student_verified = undefined (grandfathered), so
    // only explicitly false triggers the redirect.
    if (user.user_metadata?.student_verified === false) {
      return NextResponse.redirect(new URL('/verify-student', request.url))
    }

    // Annual reauthentication check — only if timestamp is set (won't affect
    // legacy accounts until they next log in and receive the stamp).
    const lastReauth = user.user_metadata?.last_reauthenticated_at
    if (lastReauth && !request.nextUrl.pathname.startsWith('/reauth')) {
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
      const age = Date.now() - new Date(lastReauth).getTime()
      if (age > ONE_YEAR_MS) {
        const url = new URL('/reauth', request.url)
        url.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
    }

    // Update user activity (fire and forget - don't block the request)
    // The database function has built-in debouncing (1 minute)
    void supabase.rpc('update_user_activity', { p_user_id: user.id })

    return supabaseResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\.js|manifest\.json|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
