// Stripe sends sellers here if their onboarding link expires.
// Just generate a fresh link and redirect them.

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.redirect(`${APP_URL}/marketplace`)
    }

    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/onboard/refresh?accountId=${accountId}`,
      return_url: `${APP_URL}/api/stripe/connect/return?accountId=${accountId}`,
      type: 'account_onboarding',
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error: any) {
    console.error('Stripe refresh error:', error)
    return NextResponse.redirect(`${APP_URL}/marketplace`)
  }
}
