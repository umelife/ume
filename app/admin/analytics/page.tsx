import { createServiceClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin/verify'
import Link from 'next/link'

export default async function AdminAnalyticsPage() {
  try {
    await verifyAdmin()
  } catch {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin access required.</p>
          <Link href="/marketplace" className="inline-block bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
            Return to Marketplace
          </Link>
        </div>
      </div>
    )
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
        listing_id,
        listing:listings(title),
        buyer:users!orders_buyer_id_fkey(display_name),
        seller:users!orders_seller_id_fkey(display_name)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50),
  ])

  const totalVolumeCents = volumeData?.reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) ?? 0
  const totalVolumeDollars = (totalVolumeCents / 100).toFixed(2)
  const avgSaleDollars = totalTransactions && totalTransactions > 0
    ? ((totalVolumeCents / totalTransactions) / 100).toFixed(2)
    : '0.00'
  const completionRate = totalHandshakes && totalHandshakes > 0
    ? Math.round(((completedHandshakes ?? 0) / totalHandshakes) * 100)
    : 0

  const statCards = [
    { label: 'Total Transactions', value: totalTransactions ?? 0, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
    { label: 'Total Volume', value: `$${totalVolumeDollars}`, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    { label: 'Avg Sale Price', value: `$${avgSaleDollars}`, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    { label: 'Active Listings', value: activeListings ?? 0, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
    { label: 'Reserved Listings', value: reservedListings ?? 0, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
    { label: 'Sold Listings', value: soldListings ?? 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    { label: 'New Users (30d)', value: newUsers ?? 0, color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    { label: 'Handshake Completion', value: `${completionRate}%`, color: 'bg-pink-50 border-pink-200', text: 'text-pink-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Analytics</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/admin" className="text-blue-600 hover:underline">← Moderation</Link>
            </div>
          </div>
          <a
            href="/api/admin/export-transactions"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Transactions CSV
          </a>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Handshake funnel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Safe-Handshake Funnel</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{totalHandshakes ?? 0}</span>
            <span className="text-gray-400">initiated →</span>
            <span className="font-semibold">{completedHandshakes ?? 0}</span>
            <span className="text-gray-400">completed</span>
            <span className="ml-2 bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded">{completionRate}% success</span>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Recent Transactions</h2>
            <p className="text-sm text-gray-500">Last 50 completed sales</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(recentTransactions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions yet</td>
                  </tr>
                )}
                {(recentTransactions ?? []).map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {order.completed_at ? new Date(order.completed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-black max-w-[180px] truncate">
                      {order.listing?.title ?? 'Deleted listing'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.seller?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{order.buyer?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      ${((order.amount_cents ?? 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{order.payment_method ?? 'in_person'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
