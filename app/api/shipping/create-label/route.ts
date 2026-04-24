/**
 * Create Shipping Label Route
 *
 * Called by the seller after an order is paid to buy a shipping label.
 * Uses the EasyPost shipment ID + rate ID stored on the order to purchase
 * the label, then saves the label URL and tracking number to the order.
 *
 * POST body:
 *   orderId — the order to generate a label for
 *
 * Returns:
 *   { labelUrl, trackingNumber, trackingUrl, carrier }
 */

import { NextRequest, NextResponse } from 'next/server'
import { easypost } from '@/lib/easypost/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notifyBuyerOrderShipped } from '@/lib/notifications/createNotification'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate — must be the seller
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const db = await createServiceClient()

    // 2. Fetch the order
    const { data: order, error: orderError } = await db
      .from('orders')
      .select('*, listing:listings(title)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Only the seller can generate the label
    if (order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Order must be paid
    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: `Cannot generate label for order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // 5. Must have EasyPost shipment + rate IDs (set during checkout)
    if (!order.easypost_shipment_id || !order.easypost_rate_id) {
      return NextResponse.json(
        { error: 'No EasyPost shipment/rate found for this order' },
        { status: 400 }
      )
    }

    // 6. Don't generate a label twice
    if (order.shipping_label_url) {
      return NextResponse.json({
        labelUrl: order.shipping_label_url,
        trackingNumber: (order as any).tracking_number || null,
        trackingUrl: (order as any).tracking_url || null,
        carrier: (order as any).carrier || null,
        alreadyGenerated: true,
      })
    }

    // 7. Recreate shipment from raw stored data (avoids EasyPost address re-verification)
    //    Pull listing shipping details + buyer address from the order record
    const { data: listingDetails } = await db
      .from('listings')
      .select('ships_from_street, ships_from_zip, ships_from_city, ships_from_state, weight_oz, pkg_length, pkg_width, pkg_height, user_id')
      .eq('id', order.listing_id)
      .single()

    const { data: seller } = await db
      .from('users')
      .select('display_name')
      .eq('id', order.seller_id)
      .single()

    const buyerAddr = order.buyer_shipping_address as any

    // Pre-create addresses via Address API with verify_strict:false so EasyPost
    // stores them without failing — then reference by ID in the shipment so
    // Shipment.buy() never re-validates them.
    const [fromAddress, toAddress] = await Promise.all([
      easypost.Address.create({
        name: seller?.display_name || 'UME Seller',
        street1: listingDetails?.ships_from_street || undefined,
        city: listingDetails?.ships_from_city || undefined,
        state: listingDetails?.ships_from_state || undefined,
        zip: listingDetails?.ships_from_zip,
        country: 'US',
      } as any),
      easypost.Address.create({
        name: buyerAddr?.name || 'Buyer',
        street1: buyerAddr?.street1,
        street2: buyerAddr?.street2 || undefined,
        city: buyerAddr?.city,
        state: buyerAddr?.state,
        zip: buyerAddr?.zip,
        country: 'US',
      } as any),
    ])

    const freshShipment = await easypost.Shipment.create({
      from_address: { id: fromAddress.id },
      to_address: { id: toAddress.id },
      parcel: {
        weight: listingDetails?.weight_oz || 8,
        length: listingDetails?.pkg_length || undefined,
        width: listingDetails?.pkg_width || undefined,
        height: listingDetails?.pkg_height || undefined,
      },
    })

    const matchingRate = freshShipment.rates?.[0]
    if (!matchingRate) {
      return NextResponse.json({ error: 'No shipping rates available' }, { status: 500 })
    }

    const shipment = await easypost.Shipment.buy(freshShipment.id, { id: matchingRate.id } as any)

    const labelUrl = shipment.postage_label?.label_url
    const trackingNumber = shipment.tracking_code
    const trackingUrl = shipment.tracker?.public_url || null
    const carrier = shipment.selected_rate?.carrier || null

    if (!labelUrl) {
      return NextResponse.json({ error: 'Label URL not returned from EasyPost' }, { status: 500 })
    }

    // 8. Save label + tracking info to the order
    await db.from('orders').update({
      shipping_label_url: labelUrl,
      tracking_number: trackingNumber || null,
      tracking_url: trackingUrl || null,
      carrier: carrier || null,
      status: 'processing', // seller has label, item being shipped
    }).eq('id', orderId)

    // 9. Notify the buyer
    const orderListing = order.listing as any
    await notifyBuyerOrderShipped({
      buyerId: order.buyer_id,
      orderId,
      listingId: order.listing_id,
      listingTitle: orderListing?.title || 'Your item',
      trackingNumber: trackingNumber || 'N/A',
    }).catch(err => console.error('Notification error:', err))

    return NextResponse.json({
      labelUrl,
      trackingNumber,
      trackingUrl,
      carrier,
    })

  } catch (error: any) {
    console.error('EasyPost create-label error:', error)
    if (error.errors) console.error('EasyPost errors detail:', JSON.stringify(error.errors, null, 2))
    return NextResponse.json(
      { error: error.message || 'Failed to generate label' },
      { status: 500 }
    )
  }
}
