'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Order = {
  id: string
  status: string
  amount_cents: number
  fulfillment_type: string
  payment_method: string
  created_at: string
  tracking_number?: string
  listing: { id: string; title: string; image_urls: string[] } | null
  buyer: { id: string; display_name: string } | null
  seller: { id: string; display_name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  paid:       'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  completed:  'bg-green-100 text-green-800',
  cancelled:  'bg-gray-100 text-gray-800',
  refunded:   'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [supabase] = useState(() => createClient())
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [supabase])

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const column = tab === 'purchases' ? 'buyer_id' : 'seller_id'

    supabase
      .from('orders')
      .select(`
        id, status, amount_cents, fulfillment_type, payment_method, created_at, tracking_number,
        listing:listings(id, title, image_urls),
        buyer:users!orders_buyer_id_fkey(id, display_name),
        seller:users!orders_seller_id_fkey(id, display_name)
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as any[]) || [])
        setLoading(false)
      })
  }, [userId, tab, supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">Orders</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(['purchases', 'sales'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
                tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ume-indigo" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">{tab === 'purchases' ? '🛍️' : '📦'}</p>
            <p className="font-medium">No {tab} yet</p>
            {tab === 'purchases' && (
              <Link href="/marketplace" className="mt-3 inline-block text-sm text-ume-indigo hover:underline">
                Browse marketplace →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const listing = order.listing as any
              const other = tab === 'purchases' ? (order.seller as any) : (order.buyer as any)
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 items-start">
                    {listing?.image_urls?.[0] ? (
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-black truncate">{listing?.title || 'Unknown item'}</p>
                        <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-0.5">
                        {tab === 'purchases' ? 'Sold by' : 'Bought by'} {other?.display_name || '—'}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-black">
                          ${((order.amount_cents ?? 0) / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {order.tracking_number && (
                        <p className="text-xs text-indigo-600 mt-1 font-mono">
                          Tracking: {order.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
