/**
 * Stripe Connect Account Webhook
 *
 * Handles account.updated events for connected sellers.
 * When Stripe confirms a seller's account is fully onboarded,
 * we update their stripe_onboarding_completed flag in the DB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const webhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
    }

    const event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'account.updated') {
      const account = event.data.object as any
      const accountId: string = account.id
      const onboardingComplete = account.details_submitted === true && account.charges_enabled === true

      const db = await createServiceClient()
      await db.from('users').update({
        stripe_onboarding_completed: onboardingComplete,
      }).eq('stripe_account_id', accountId)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Connect webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
