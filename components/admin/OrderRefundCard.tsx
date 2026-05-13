'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Order } from '@/types/database'

interface Props {
  order: Order & { buyer?: { email: string; display_name: string }; listing?: { title: string } }
}

export default function OrderRefundCard({ order }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const amount = `$${((order.amount_cents ?? 0) / 100).toFixed(2)}`
  const age = formatDistanceToNow(new Date(order.created_at), { addSuffix: true })

  async function handleRefund() {
    if (!confirm(`Refund ${amount} for "${order.listing?.title ?? order.listing_id}"?`)) return
    setStatus('loading')
    setErrMsg(null)
    try {
      const res = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: 'requested_by_customer' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Refund failed')
      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      setErrMsg(err.message)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {order.listing?.title ?? order.listing_id}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Buyer: {order.buyer?.display_name ?? order.buyer_id} · {order.buyer?.email}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{age}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-gray-900">{amount}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          order.status === 'paid' ? 'bg-green-100 text-green-700' :
          order.status === 'refunded' ? 'bg-gray-100 text-gray-500' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {order.status}
        </span>

        {status === 'done' ? (
          <span className="text-xs text-green-600 font-semibold">Refunded ✓</span>
        ) : status === 'error' ? (
          <span className="text-xs text-red-500">{errMsg}</span>
        ) : order.status === 'paid' ? (
          <button
            onClick={handleRefund}
            disabled={status === 'loading'}
            className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Refunding…' : 'Issue Refund'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
