/**
 * Shipping Rates Route
 *
 * Creates an EasyPost Shipment (without buying a label) to get available
 * carrier rates for a listing being shipped to a buyer's address.
 *
 * POST body:
 *   listingId   — to fetch weight, dimensions, ships_from_zip
 *   toName      — buyer's name
 *   toStreet1   — buyer's street address
 *   toStreet2   — apt/suite (optional)
 *   toCity      — buyer's city
 *   toState     — buyer's state
 *   toZip       — buyer's ZIP code
 *
 * Returns array of rates:
 *   [{ id, shipmentId, carrier, service, rateCents, deliveryDays }]
 */

import { NextRequest, NextResponse } from 'next/server'
import { easypost } from '@/lib/easypost/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the buyer
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, toName, toStreet1, toStreet2, toCity, toState, toZip } = body

    if (!listingId || !toStreet1 || !toCity || !toState || !toZip) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 2. Fetch listing shipping details
    const db = await createServiceClient()
    const { data: listing, error: listingError } = await db
      .from('listings')
      .select('ships_from_street, ships_from_zip, ships_from_city, ships_from_state, weight_oz, pkg_length, pkg_width, pkg_height, user_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!listing.ships_from_zip) {
      return NextResponse.json({ error: 'Seller has not set a ship-from ZIP code' }, { status: 400 })
    }

    if (!listing.weight_oz) {
      return NextResponse.json({ error: 'Seller has not set package weight' }, { status: 400 })
    }

    // 3. Fetch seller's address details for the from address
    const { data: seller } = await db
      .from('users')
      .select('display_name, email')
      .eq('id', listing.user_id)
      .single()

    // 4. Pre-create addresses via Address API (verify_strict:false = create even if
    //    verification fails), then reference by ID so the shipment never re-validates them.
    const [fromAddress, toAddress] = await Promise.all([
      easypost.Address.create({
        name: seller?.display_name || 'UME Seller',
        street1: listing.ships_from_street || undefined,
        city: listing.ships_from_city || undefined,
        state: listing.ships_from_state || undefined,
        zip: listing.ships_from_zip,
        country: 'US',
      } as any),
      easypost.Address.create({
        name: toName || 'Buyer',
        street1: toStreet1,
        street2: toStreet2 || undefined,
        city: toCity,
        state: toState,
        zip: toZip,
        country: 'US',
      } as any),
    ])

    const shipment = await easypost.Shipment.create({
      from_address: { id: fromAddress.id },
      to_address: { id: toAddress.id },
      parcel: {
        weight: listing.weight_oz,                        // oz
        length: listing.pkg_length || undefined,          // inches
        width: listing.pkg_width || undefined,            // inches
        height: listing.pkg_height || undefined,          // inches
      },
    })

    // 5. Format rates for the frontend
    const rates = (shipment.rates || [])
      .filter((r: any) => r.rate && parseFloat(r.rate) > 0)
      .map((r: any) => ({
        id: r.id,
        shipmentId: shipment.id,
        carrier: r.carrier,
        service: r.service,
        rateCents: Math.round(parseFloat(r.rate) * 100),
        deliveryDays: r.delivery_days ?? null,
        deliveryDate: r.delivery_date ?? null,
      }))
      .sort((a: any, b: any) => a.rateCents - b.rateCents) // cheapest first

    return NextResponse.json({ rates, shipmentId: shipment.id })

  } catch (error: any) {
    console.error('EasyPost rates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping rates' },
      { status: 500 }
    )
  }
}
