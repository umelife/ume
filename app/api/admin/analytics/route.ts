/**
 * Admin Analytics API Route
 *
 * Returns aggregated platform metrics for the admin analytics dashboard.
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalTransactions },
      { data: volumeData },
      { count: activeListings },
      { count: reservedListings },
      { count: soldListings },
      { count: newUsers },
      { count: totalHandshakes },
      { count: completedHandshakes },
      { data: recentTransactions },
    ] = await Promise.all([
      db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('orders').select('amount_cents').eq('status', 'completed'),
      db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
      db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      db.from('safe_handshakes').select('*', { count: 'exact', head: true }),
      db.from('safe_handshakes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('orders')
        .select(`
          id,
          amount_cents,
          completed_at,
          payment_method,
          listing:listings(title),
          buyer:users!orders_buyer_id_fkey(display_name, email),
          seller:users!orders_seller_id_fkey(display_name, email)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50),
    ])

    const totalVolumeCents = volumeData?.reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) ?? 0
    const avgSaleCents = totalTransactions && totalTransactions > 0
      ? Math.round(totalVolumeCents / totalTransactions)
      : 0
    const completionRate = totalHandshakes && totalHandshakes > 0
      ? Math.round(((completedHandshakes ?? 0) / totalHandshakes) * 100)
      : 0

    return NextResponse.json({
      metrics: {
        totalTransactions: totalTransactions ?? 0,
        totalVolumeCents,
        avgSaleCents,
        activeListings: activeListings ?? 0,
        reservedListings: reservedListings ?? 0,
        soldListings: soldListings ?? 0,
        newUsersLast30Days: newUsers ?? 0,
        handshakeCompletionRate: completionRate,
        totalHandshakes: totalHandshakes ?? 0,
        completedHandshakes: completedHandshakes ?? 0,
      },
      recentTransactions: recentTransactions ?? [],
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
