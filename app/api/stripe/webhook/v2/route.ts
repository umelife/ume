/**
 * Stripe V2 Thin Events Webhook Handler
 *
 * Handles V2 connected account events using Stripe's "thin" event format.
 * Thin events contain only the event ID — we fetch the full event data from Stripe.
 *
 * Events handled:
 *   - v2.core.account[requirements].updated — seller requirements changed
 *   - v2.core.account[.recipient].capability_status_updated — capability status changed
 *
 * Setup in Stripe Dashboard:
 *   Developers → Webhooks → Add destination → Connected accounts → Thin payload
 *   Forward to: https://yourdomain.com/api/stripe/webhook/v2
 *
 * Local testing:
 *   stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' --forward-thin-to localhost:3000/api/stripe/webhook/v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const v2WebhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!v2WebhookSecret) {
    // Fall back gracefully if V2 webhook secret not yet configured
    console.warn('STRIPE_V2_WEBHOOK_SECRET not set — V2 webhook ignored')
    return NextResponse.json({ received: true })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Parse the thin event — this only contains the event ID, not the full data
    const thinEvent = stripeClient.parseThinEvent(body, signature, v2WebhookSecret)

    // Fetch the full event from Stripe using the event ID
    const event = await stripeClient.v2.core.events.retrieve(thinEvent.id)

    const db = await createServiceClient()

    switch (event.type) {

      // ─── Account requirements changed ───────────────────────────────────────
      case 'v2.core.account[requirements].updated':
      // ─── Recipient capability status changed ─────────────────────────────────
      case 'v2.core.account[.recipient].capability_status_updated': {
        // Re-fetch the account to get current capability status
        const relatedObject = (event as any).related_object
        const accountId = relatedObject?.id

        if (!accountId) break

        const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
          include: ['configuration.recipient', 'requirements'],
        })

        // Check if transfers are now active
        const transfersActive =
          account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === 'active'

        const requirementsStatus = (account as any).requirements?.summary?.minimum_deadline?.status
        const onboardingComplete =
          transfersActive || (requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due')

        // Update the seller's onboarding status in the database
        await db.from('users').update({
          stripe_onboarding_completed: onboardingComplete,
        }).eq('stripe_account_id', accountId)

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('V2 webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'V2 webhook handler failed' },
      { status: 500 }
    )
  }
}
