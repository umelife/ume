'use client'

/**
 * BuyButton Component - Updated for MVP (Payment-Free)
 *
 * Provides "Add to Cart" and "Contact Seller" buttons for listings.
 * Buy Now button replaced with Contact Seller to arrange payment directly.
 *
 * TODO: When re-enabling payments, restore original Buy Now functionality
 * See docs/cart-mvp.md for restoration instructions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import type { Listing } from '@/types/database'

interface BuyButtonProps {
  listing: Listing
  className?: string
}

export default function BuyButton({ listing, className = '' }: BuyButtonProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [cartLoading, setCartLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddToCart = async () => {
    try {
      setCartLoading(true)
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent adding your own listing
      if (user.id === listing.user_id) {
        setError('You cannot add your own listing to cart')
        setCartLoading(false)
        return
      }

      const result = await addToCart(listing.id, 1)

      if (result.error) {
        setError(result.error)
      } else {
        setAdded(true)
        router.refresh()
        setTimeout(() => setAdded(false), 2000)
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      setError(err.message || 'Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const handleContactSeller = async () => {
    try {
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent contacting yourself
      if (user.id === listing.user_id) {
        setError('This is your own listing')
        return
      }

      // Generate prefill message
      const prefillMessage = encodeURIComponent(
        `Hi — I'm interested in "${listing.title}". Could we arrange a time to meet on campus for pickup? I can pay via cash, PayPal, or Venmo.`
      )

      // Navigate to messages with prefill
      router.push(`/messages?listing=${listing.id}&seller=${listing.user_id}&prefill=${prefillMessage}`)

    } catch (err: any) {
      console.error('Contact seller error:', err)
      setError(err.message || 'Failed to open chat')
    }
  }

  return (
    <div className="space-y-3">
      {/* Contact Seller Button - Replaces Buy Now */}
      <button
        onClick={handleContactSeller}
        className={`w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors ${className}`}
        aria-label={`Contact seller about ${listing.title}`}
      >
        💬 Contact Seller
      </button>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={cartLoading || added}
        className={`w-full border-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          added
            ? 'border-green-600 text-green-600 bg-green-50'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={`Add ${listing.title} to cart`}
      >
        {cartLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : added ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Added to Cart!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Add to Cart
          </span>
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm text-center" role="alert">{error}</p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Contact the seller to arrange payment and pickup
      </p>
    </div>
  )
}
