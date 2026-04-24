'use client'

/**
 * BuySection
 *
 * Always shows all 4 options to every buyer — regardless of the listing's
 * fulfillment_type. International students without cars can still choose shipping.
 *
 * Layout: compact 2×2 grid
 *   [Pay with Card ⭐]  [Cash / Venmo]
 *   [Ship to Me]        [Message Seller]
 *
 * Options 1 & 3 are disabled (grayed) if the seller hasn't completed Stripe setup.
 * Options 2 & 4 are always active (no payment required).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateConversation } from '@/lib/chat/conversations'
import ShippingCheckoutFlow from './ShippingCheckoutFlow'

interface Props {
  listing: {
    id: string
    title: string
    price: number
    user_id: string
    seller?: {
      stripe_onboarding_completed?: boolean
    } | null
  }
  currentUserId: string
}

export default function BuySection({ listing, currentUserId }: Props) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [msgLoading, setMsgLoading] = useState(false)
  const [showShippingFlow, setShowShippingFlow] = useState(false)

  const sellerHasStripe = listing.seller?.stripe_onboarding_completed === true

  // ── Option 1: Pay with Card + Meet in Person ──────────────────────────────
  const handleStripeInPerson = async () => {
    setStripeLoading(true)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, fulfillmentType: 'in_person' }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err: any) {
      setStripeError(err.message)
      setStripeLoading(false)
    }
  }

  // ── Shared chat opener (Options 2 & 4) ───────────────────────────────────
  const openChat = async (prefillMsg: string, setLoading: (v: boolean) => void) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }
      const result = await getOrCreateConversation(user.id, listing.user_id, listing.id)
      if (result.error || !result.conversationId) throw new Error(result.error || 'Failed to open chat')
      const prefill = encodeURIComponent(prefillMsg)
      router.push(`/messages?conversationId=${result.conversationId}&prefill=${prefill}`)
    } catch (err: any) {
      setChatError(err.message)
      setLoading(false)
    }
  }

  if (showShippingFlow) {
    return <ShippingCheckoutFlow listing={listing} onClose={() => setShowShippingFlow(false)} />
  }

  const disabled = 'opacity-40 cursor-not-allowed'
  const stripeMsg = "Seller hasn't set up Stripe yet"

  return (
    <div className="space-y-2">

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-2">

        {/* Option 1 — Pay with Card */}
        <button
          onClick={sellerHasStripe ? handleStripeInPerson : undefined}
          disabled={!sellerHasStripe || stripeLoading}
          title={!sellerHasStripe ? stripeMsg : undefined}
          className={`flex flex-col items-center justify-center gap-1 bg-ume-indigo text-white font-semibold py-3 px-3 rounded-2xl transition-colors text-sm
            ${sellerHasStripe ? 'hover:bg-indigo-800' : disabled}`}
        >
          {stripeLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )}
          <span className="leading-tight text-center">
            {stripeLoading ? 'Redirecting...' : 'Pay with Card'}
          </span>
          {!stripeLoading && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full leading-none">⭐ Safe</span>
          )}
        </button>

        {/* Option 2 — Cash / Venmo */}
        <button
          onClick={() => openChat(
            `Hi — I'm interested in "${listing.title}". Are you available to meet on campus for pickup?`,
            setChatLoading
          )}
          disabled={chatLoading}
          className="flex flex-col items-center justify-center gap-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-3 rounded-2xl hover:border-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
        >
          {chatLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
          <span className="leading-tight text-center">
            {chatLoading ? 'Opening...' : 'Cash / Venmo'}
          </span>
        </button>

        {/* Option 3 — Ship to Me */}
        <button
          onClick={sellerHasStripe ? () => setShowShippingFlow(true) : undefined}
          disabled={!sellerHasStripe}
          title={!sellerHasStripe ? stripeMsg : undefined}
          className={`flex flex-col items-center justify-center gap-1 bg-ume-pink text-white font-semibold py-3 px-3 rounded-2xl transition-colors text-sm
            ${sellerHasStripe ? 'hover:bg-pink-400' : disabled}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 13h12l1-13M10 12v5m4-5v5" />
          </svg>
          <span className="leading-tight text-center">Ship to Me</span>
        </button>

        {/* Option 4 — Message Seller */}
        <button
          onClick={() => openChat(
            `Hi! Is "${listing.title}" still available?`,
            setMsgLoading
          )}
          disabled={msgLoading}
          className="flex flex-col items-center justify-center gap-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-3 rounded-2xl hover:border-ume-indigo hover:text-ume-indigo hover:bg-indigo-50 disabled:opacity-50 transition-colors text-sm"
        >
          {msgLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          <span className="leading-tight text-center">
            {msgLoading ? 'Opening...' : 'Contact Seller'}
          </span>
        </button>

      </div>

      {/* Error messages */}
      {stripeError && <p className="text-xs text-red-500 px-1">{stripeError}</p>}
      {chatError && <p className="text-xs text-red-500 px-1">{chatError}</p>}

      {/* Helper text */}
      <p className="text-[11px] text-gray-400 text-center px-1">
        {sellerHasStripe
          ? '💳 Card authorized now — only charged after Safe-Handshake QR scan'
          : stripeMsg + ' · Cash/Venmo and messaging always available'}
      </p>

    </div>
  )
}
