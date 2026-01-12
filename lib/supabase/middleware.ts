import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/create', '/admin', '/profile', '/dashboard', '/item']

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  console.log('[Middleware] Processing request:', {
    pathname,
    tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null,
    type,
    hasCookies: request.cookies.getAll().length > 0
  })

  let supabaseResponse = NextResponse.next({
    request,
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
          console.log('[Middleware] Setting cookies:', cookiesToSet.map(c => ({ name: c.name, hasValue: !!c.value })))
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token - this handles PKCE code exchange automatically
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('[Middleware] Auth check result:', {
    hasUser: !!user,
    userId: user?.id,
    userError: userError?.message,
    pathname
  })

  // Check if the path needs protection
  const isProtectedPath = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  // Redirect to login if accessing protected path without authentication
  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
