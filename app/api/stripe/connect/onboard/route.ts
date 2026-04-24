/**
 * Stripe Connect Onboarding Route
 *
 * Creates a Stripe Express connected account for the seller, then redirects
 * them to Stripe's hosted onboarding form to enter bank details + identity.
 *
 * Flow:
 *   1. POST /api/stripe/connect/onboard
 *   2. Create (or reuse) a Stripe Express account
 *   3. Save stripe_account_id to users table
 *   4. Create an account link (hosted onboarding URL)
 *   5. Return { url } — frontend redirects seller to Stripe
 *   6. After onboarding, Stripe sends seller to /api/stripe/connect/return
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createServiceClient()
    const { data: profile } = await db
      .from('users')
      .select('stripe_account_id, email, display_name')
      .eq('id', user.id)
      .single()

    let stripeAccountId = profile?.stripe_account_id

    // Create a Stripe Express account if the seller doesn't have one yet
    if (!stripeAccountId) {
      const account = await stripeClient.accounts.create({
        type: 'express',
        country: 'US',
        email: profile?.email || user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: { interval: 'manual' },
          },
        },
      })

      stripeAccountId = account.id

      await db
        .from('users')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', user.id)
    }

    // Create a hosted onboarding link
    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${APP_URL}/api/stripe/connect/onboard/refresh?accountId=${stripeAccountId}`,
      return_url: `${APP_URL}/api/stripe/connect/return?accountId=${stripeAccountId}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })

  } catch (error: any) {
    console.error('Stripe Connect onboard error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start onboarding' },
      { status: 500 }
    )
  }
}
