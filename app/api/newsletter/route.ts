import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'homepage' } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const db = await createServiceClient()

    const { error } = await db
      .from('newsletter_subscribers')
      .upsert({ email: normalized, source, unsubscribed_at: null }, { onConflict: 'email' })

    if (error) {
      console.error('[Newsletter] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Newsletter] Error:', err.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
