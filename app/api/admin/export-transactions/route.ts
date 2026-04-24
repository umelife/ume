/**
 * Admin Transaction CSV Export Route
 *
 * Exports all completed in-person transactions as CSV.
 * Only accessible to admin users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin/verify'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const db = await createServiceClient()
    const { data: orders, error: ordersError } = await db
      .from('orders')
      .select(`
        id,
        amount_cents,
        payment_method,
        status,
        completed_at,
        created_at,
        listing_id,
        listing:listings(title),
        buyer:users!orders_buyer_id_fkey(id, display_name, email),
        seller:users!orders_seller_id_fkey(id, display_name, email)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching transactions:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const csvRows: string[] = []

    csvRows.push([
      'Order ID',
      'Completed At',
      'Listing ID',
      'Listing Title',
      'Amount ($)',
      'Payment Method',
      'Buyer ID',
      'Buyer Name',
      'Buyer Email',
      'Seller ID',
      'Seller Name',
      'Seller Email',
    ].join(','))

    for (const order of orders ?? []) {
      const amountDollars = ((order.amount_cents ?? 0) / 100).toFixed(2)
      csvRows.push([
        `"${order.id}"`,
        `"${order.completed_at ?? ''}"`,
        `"${order.listing_id}"`,
        `"${((order.listing as any)?.title ?? 'N/A').replace(/"/g, '""')}"`,
        `"${amountDollars}"`,
        `"${order.payment_method ?? 'in_person'}"`,
        `"${(order.buyer as any)?.id ?? ''}"`,
        `"${((order.buyer as any)?.display_name ?? 'N/A').replace(/"/g, '""')}"`,
        `"${(order.buyer as any)?.email ?? 'N/A'}"`,
        `"${(order.seller as any)?.id ?? ''}"`,
        `"${((order.seller as any)?.display_name ?? 'N/A').replace(/"/g, '""')}"`,
        `"${(order.seller as any)?.email ?? 'N/A'}"`,
      ].join(','))
    }

    const csv = csvRows.join('\n')
    const date = new Date().toISOString().split('T')[0]

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ume-transactions-${date}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
