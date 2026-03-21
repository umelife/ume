/**
 * StripeSetupBanner (Server Component)
 *
 * Shows a global amber banner for logged-in users who haven't set up Stripe.
 * Placed in the root layout so it appears on every page.
 * Dismissible client-side — reappears on next page load until Stripe is set up.
 */

import { getUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import StripeSetupBannerClient from './StripeSetupBannerClient'

export default async function StripeSetupBanner() {
  const { user } = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_onboarding_completed')
    .eq('id', user.id)
    .single()

  // Already set up — no banner
  if (profile?.stripe_onboarding_completed) return null

  return <StripeSetupBannerClient />
}
