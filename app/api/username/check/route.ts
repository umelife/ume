import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/username/check
 *
 * Check if a username is available (case-insensitive)
 * Uses service role client to bypass RLS for availability checking
 *
 * Request body: { username: string }
 * Response: { available: boolean } | { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required', available: false },
        { status: 400 }
      )
    }

    // Trim and validate username
    const trimmedUsername = username.trim()

    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters', available: false },
        { status: 400 }
      )
    }

    if (trimmedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 20 characters or less', available: false },
        { status: 400 }
      )
    }

    // Validate username format (slugified: lowercase, alphanumeric, hyphens)
    const usernameRegex = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
    if (!usernameRegex.test(trimmedUsername)) {
      return NextResponse.json(
        {
          error: 'Username must be 3-64 characters, lowercase letters, numbers, and hyphens only',
          available: false
        },
        { status: 400 }
      )
    }

    // Use service role client to check availability (bypasses RLS)
    const supabase = await createServiceClient()

    // Check for case-insensitive match using PostgreSQL lower() function
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .ilike('username', trimmedUsername)
      .maybeSingle()

    if (error) {
      // PGRST116 is PostgREST's "not found" code, which is expected when username is available
      if (error.code === 'PGRST116') {
        return NextResponse.json({ available: true })
      }

      // Log unexpected errors
      console.error('Error checking username availability:', error)
      return NextResponse.json(
        { error: 'Failed to check username availability', available: false },
        { status: 500 }
      )
    }

    // If data exists, username is taken
    const available = !data

    return NextResponse.json({ available })

  } catch (error) {
    console.error('Unexpected error in username check:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', available: false },
      { status: 500 }
    )
  }
}
