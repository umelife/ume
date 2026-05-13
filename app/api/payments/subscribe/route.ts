import { NextResponse } from 'next/server'

// Phase 2: wire Stripe Billing subscription here
export async function POST() {
  return NextResponse.json(
    { error: 'Subscriptions coming soon.' },
    { status: 503 },
  )
}
