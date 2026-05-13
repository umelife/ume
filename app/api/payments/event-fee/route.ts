import { NextResponse } from 'next/server'

// Phase 2: wire Stripe payment_intent here
// For now, return a stub so the UI doesn't crash
export async function POST() {
  return NextResponse.json(
    { error: 'Event payments coming soon. Your event has been saved as a draft.' },
    { status: 503 },
  )
}
