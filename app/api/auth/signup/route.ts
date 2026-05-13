import { createClient } from '@/lib/supabase/server'
import { isEduEmail } from '@/lib/utils/helpers'
import { checkUsernameAvailability } from '@/lib/auth/actions'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const {
      email, password, username,
      accountType = 'student',
      collegeName, collegeAddress,
      displayName, orgName, city, state,
    } = await request.json()

    const isStudent = accountType === 'student'

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (isStudent) {
      if (!collegeName?.trim()) {
        return NextResponse.json({ error: 'College name is required' }, { status: 400 })
      }
      if (!collegeAddress?.trim()) {
        return NextResponse.json({ error: 'College address is required' }, { status: 400 })
      }
    } else {
      if (!displayName?.trim()) {
        return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
      }
    }

    const usernameCheck = await checkUsernameAvailability(username)
    if (!usernameCheck.available) {
      return NextResponse.json(
        { error: usernameCheck.error || 'Username already exists — try another' },
        { status: 400 }
      )
    }

    // Geo-block students only (orgs/personal can be anywhere)
    if (isStudent) {
      const country = request.headers.get('x-vercel-ip-country')
      if (country && country !== 'US') {
        return NextResponse.json(
          { error: 'UME is currently only available to students in the United States' },
          { status: 403 }
        )
      }
      if (!isEduEmail(email)) {
        return NextResponse.json(
          { error: 'Student accounts require a .edu email address' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    const metadata = isStudent
      ? {
          username,
          display_name: username,
          college_name: collegeName.trim(),
          college_address: collegeAddress.trim(),
          account_type: 'student',
          student_verified: false,
        }
      : {
          username,
          display_name: displayName.trim(),
          org_name: orgName?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          account_type: accountType,
          student_verified: null,
        }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        data: metadata,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Poll for the DB trigger to create the profile (up to 1 second, 5 attempts)
    let profile = null
    let profileError = null
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', authData.user.id)
        .maybeSingle()
      if (data) { profile = data; break }
      profileError = error
    }

    if (profileError || !profile) {
      // ROLLBACK: Delete the auth user if profile creation failed
      console.error('Profile creation failed, rolling back auth user:', profileError)

      // Check if error is due to unique constraint violation (race condition)
      const errorMessage = profileError?.message?.toLowerCase() || ''
      const errorCode = (profileError as any)?.code || ''

      if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode === '23505') {
        // PostgreSQL error code 23505 = unique_violation
        return NextResponse.json(
          { error: 'Username already exists — try another' },
          { status: 409 }
        )
      }

      // Note: We can't directly delete from auth.users via the client
      // The database trigger should have handled this, but if it failed,
      // the user will need to contact support or try signing up again

      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      )
    }

    // Double-check that username was set correctly
    if (profile.username?.toLowerCase() !== username.toLowerCase()) {
      console.error('Username mismatch after profile creation:', {
        expected: username,
        actual: profile.username
      })

      return NextResponse.json(
        { error: 'Failed to set username correctly. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Signup successful! Please check your email to verify your account.',
      user: authData.user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
