'use client'

import { useState } from 'react'
import { addToCart } from '@/lib/cart/actions'
import { useRouter } from 'next/navigation'

interface AddToCartButtonProps {
  listingId: string
  className?: string
  showIcon?: boolean
}

export default function AddToCartButton({
  listingId,
  className = '',
  showIcon = true
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  const handleAddToCart = async () => {
    setLoading(true)

    const result = await addToCart(listingId, 1)

    if (result.error) {
      alert(result.error)
    } else {
      setAdded(true)
      router.refresh() // Refresh to update cart count in header

      // Reset "added" state after 2 seconds
      setTimeout(() => setAdded(false), 2000)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || added}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        added
          ? 'bg-green-600 text-white cursor-default'
          : 'bg-black text-white hover:bg-gray-800'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {showIcon && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {added ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          )}
        </svg>
      )}
      {loading ? 'Adding...' : added ? 'Added!' : 'Add to Liked'}
    </button>
  )
}
