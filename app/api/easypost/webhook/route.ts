/**
 * EasyPost Tracking Webhook
 *
 * EasyPost sends events when a shipment's tracking status changes.
 * When the tracker reports 'delivered', we mark the order as completed.
 *
 * Setup in EasyPost dashboard:
 *   Webhooks → Add → URL: https://ume-life.com/api/easypost/webhook
 *
 * Relevant event:
 *   tracker.updated — result.status === 'delivered' → order completed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // EasyPost webhook payload shape:
    //   { description: 'tracker.updated', result: { tracking_code, status, ... } }
    const eventType: string = body.description
    const result = body.result

    if (eventType === 'tracker.updated' && result?.status === 'delivered') {
      const trackingCode: string | undefined = result.tracking_code

      if (trackingCode) {
        const db = await createServiceClient()

        // Find the order by tracking number
        const { data: order } = await db
          .from('orders')
          .select('id, listing_id')
          .eq('tracking_number', trackingCode)
          .eq('status', 'processing')
          .maybeSingle()

        if (order) {
          // Mark order as completed — item delivered
          await db.from('orders').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          }).eq('id', order.id)

          // Mark listing as sold
          if (order.listing_id) {
            await db.from('listings').update({ status: 'sold' }).eq('id', order.listing_id)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('EasyPost webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
