/**
 * Stripe Connect Return Route
 *
 * Stripe redirects sellers here after completing the hosted onboarding form.
 * Checks account status via V1 API and updates the database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(`${APP_URL}/login`)
    }

    const { searchParams } = new URL(request.url)
    const accountIdFromParam = searchParams.get('accountId')

    const db = await createServiceClient()
    const { data: profile } = await db
      .from('users')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    const stripeAccountId = accountIdFromParam || profile?.stripe_account_id

    if (!stripeAccountId) {
      return NextResponse.redirect(`${APP_URL}/profile/${user.id}?stripe=error`)
    }

    // Check onboarding status via V1 API
    const account = await stripeClient.accounts.retrieve(stripeAccountId)

    // Onboarding is complete when details are submitted and charges/transfers are enabled
    const onboardingComplete = account.details_submitted === true && account.charges_enabled === true

    await db
      .from('users')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_onboarding_completed: onboardingComplete,
      })
      .eq('id', user.id)

    const status = onboardingComplete ? 'connected' : 'incomplete'
    return NextResponse.redirect(`${APP_URL}/profile/${user.id}?stripe=${status}`)

  } catch (error: any) {
    console.error('Stripe Connect return error:', error)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const redirectPath = user ? `/profile/${user.id}?stripe=error` : '/marketplace'
    return NextResponse.redirect(`${APP_URL}${redirectPath}`)
  }
}
