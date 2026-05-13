'use client'

import { useState } from 'react'

interface Props {
  accountType: 'student' | 'personal' | 'organization'
  onClose: () => void
  onSuccess: () => void
}

const PRICES = {
  student:      { perEvent: 3,  sub: 4.99 },
  personal:     { perEvent: 15, sub: 9.99 },
  organization: { perEvent: 25, sub: 29.99 },
}

export default function EventPaywall({ accountType, onClose, onSuccess }: Props) {
  const [choice, setChoice] = useState<'per_event' | 'subscribe'>('per_event')
  const [loading, setLoading] = useState(false)
  const price = PRICES[accountType] ?? PRICES.personal

  async function proceed() {
    setLoading(true)
    if (choice === 'per_event') {
      const res = await fetch('/api/payments/event-fee', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setLoading(false); alert(data.error || 'Payment failed') }
    } else {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setLoading(false); alert(data.error || 'Failed to start subscription') }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-ume-indigo to-purple-700 text-white p-5">
          <h2 className="text-xl font-black" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Host this event
          </h2>
          <p className="text-white/70 text-sm mt-1">Choose how you'd like to pay</p>
        </div>

        <div className="p-5 space-y-3">
          <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
            choice === 'per_event' ? 'border-ume-indigo bg-ume-indigo/5' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              checked={choice === 'per_event'}
              onChange={() => setChoice('per_event')}
              className="mt-1 accent-ume-indigo"
            />
            <div>
              <p className="text-sm font-bold text-gray-900">Pay once — <span className="text-ume-indigo">${price.perEvent} for this event</span></p>
              <p className="text-xs text-gray-500 mt-0.5">One-time charge, no commitment</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
            choice === 'subscribe' ? 'border-ume-indigo bg-ume-indigo/5' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              checked={choice === 'subscribe'}
              onChange={() => setChoice('subscribe')}
              className="mt-1 accent-ume-indigo"
            />
            <div>
              <p className="text-sm font-bold text-gray-900">
                Subscribe — <span className="text-ume-indigo">${price.sub}/month</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Unlimited events · Cancel anytime · Saves after {Math.ceil(price.sub / price.perEvent)} events/month
              </p>
            </div>
          </label>

          <button
            onClick={proceed}
            disabled={loading}
            className="w-full bg-ume-indigo text-white font-semibold py-3 rounded-full hover:bg-indigo-800 disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? 'Redirecting…' : 'Continue →'}
          </button>
          <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
