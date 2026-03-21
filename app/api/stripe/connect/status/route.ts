/**
 * Stripe Connect Status Route
 *
 * Returns the current Stripe onboarding status for the authenticated seller.
 * The frontend uses this to show/hide the onboarding banner and enable/disable
 * shipping + Stripe payment options on listings.
 *
 * Always fetches live status from Stripe's V2 API (not just the DB flag)
 * so it stays accurate even after webhook-triggered updates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Look up their Stripe account ID from the database
    const db = await createServiceClient()
    const { data: profile } = await db
      .from('users')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      // Seller hasn't started onboarding yet
      return NextResponse.json({
        connected: false,
        accountId: null,
        transfersActive: false,
      })
    }

    // 3. Fetch live status from Stripe to ensure accuracy
    const account = await stripeClient.v2.core.accounts.retrieve(
      profile.stripe_account_id,
      { include: ['configuration.recipient', 'requirements'] }
    )

    const transfersActive =
      account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === 'active'

    const requirementsStatus = (account as any).requirements?.summary?.minimum_deadline?.status
    const onboardingComplete =
      transfersActive || (requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due')

    // 4. Sync status back to DB if it changed
    if (onboardingComplete !== profile.stripe_onboarding_completed) {
      await db
        .from('users')
        .update({ stripe_onboarding_completed: onboardingComplete })
        .eq('id', user.id)
    }

    return NextResponse.json({
      connected: onboardingComplete,
      accountId: profile.stripe_account_id,
      transfersActive,
    })

  } catch (error: any) {
    console.error('Stripe Connect status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}
