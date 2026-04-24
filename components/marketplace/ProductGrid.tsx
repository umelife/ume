'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Listing } from '@/types/database'
import { formatPrice } from '@/lib/utils/helpers'
import useCart from '@/hooks/useCart'
import { useSwipe } from '@/hooks/useSwipe'
import { createClient } from '@/lib/supabase/client'
import { sendMessageEnhanced } from '@/lib/chat/enhanced-actions'
import DeleteListingButton from '@/components/listings/DeleteListingButton'

/**
 * ProductGrid Component
 *
 * Displays listings in a responsive grid with square product cards.
 * Features:
 * - Square images (1:1 aspect ratio) with object-fit: cover
 * - Responsive: 4 cols desktop, 3 cols tablet, 2 cols mobile
 * - Shows: image, title, price, short description
 * - Optional distance display for radius-filtered listings
 */

// Sizes for a 2-col → 3-col → 4-col responsive grid with gap-6.
// Tells Next.js exactly how wide each card will render so it generates
// a perfectly-sized optimized image instead of guessing (which defaults
// to 100vw and downloads a needlessly large source file).
const CARD_SIZES =
  '(max-width: 768px) calc(50vw - 16px), (max-width: 1024px) calc(33vw - 16px), calc(25vw - 16px)'

interface ProductGridProps {
  listings: Listing[]
}

export default function ProductGrid({ listings }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {listings.map((listing, index) => (
        // Pass index so the first 4 cards get `priority` (above-the-fold LCP images)
        <ProductCard key={listing.id} listing={listing} cardIndex={index} />
      ))}
    </div>
  )
}

function ProductCard({ listing, cardIndex }: { listing: Listing; cardIndex: number }) {
  const images = listing.image_urls?.length ? listing.image_urls : ['/placeholder-image.jpg']
  const { isInCart, addToCart, removeFromCart, loadingIds } = useCart()
  const inCart = isInCart(listing.id)
  const loading = loadingIds[listing.id] === true

  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const [imgIndex, setImgIndex] = useState(0)
  const [quickMsgLoading, setQuickMsgLoading] = useState(false)
  const [quickMsgSent, setQuickMsgSent] = useState(false)
  const [heartToast, setHeartToast] = useState<'added' | 'removed' | null>(null)

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => setImgIndex(i => (i + 1) % images.length),
    () => setImgIndex(i => (i - 1 + images.length) % images.length)
  )

  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  // Check if this is the user's own listing
  const isOwnListing = currentUserId && listing.user_id === currentUserId

  // Truncate description to ~100 chars
  const shortDescription = listing.description
    ? listing.description.length > 100
      ? listing.description.substring(0, 100) + '...'
      : listing.description
    : ''

  const handleQuickMessage = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (quickMsgLoading || quickMsgSent) return
    setQuickMsgLoading(true)
    const result = await sendMessageEnhanced(
      listing.id,
      listing.user_id,
      "Hey, I'm interested in this item, is it available?"
    )
    setQuickMsgLoading(false)
    if (!result.error) {
      setQuickMsgSent(true)
      setTimeout(() => setQuickMsgSent(false), 3000)
    }
  }

  return (
    <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Toast notifications */}
      {(quickMsgSent || heartToast) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
          {quickMsgSent ? 'Quick message sent' : heartToast === 'added' ? 'Added to liked' : 'Removed from liked'}
        </div>
      )}

      <Link href={`/item/${listing.id}`} className="group flex-1">
        <div>
          {/* Square Image Container */}
          <div
            className="relative w-full pb-[100%] bg-gray-200 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Only the active image is rendered — no hidden images wasting bandwidth.
                The first 4 cards are above-the-fold on desktop and get `priority`
                so the browser prefetches them immediately for best LCP. */}
            <Image
              src={images[imgIndex]}
              alt={listing.title}
              fill
              sizes={CARD_SIZES}
              priority={cardIndex < 4}
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />

            {/* Heart icon — save to liked (top-right) */}
            {!isOwnListing && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (inCart) {
                    removeFromCart(listing.id)
                    setHeartToast('removed')
                  } else {
                    addToCart(listing.id)
                    setHeartToast('added')
                  }
                  setTimeout(() => setHeartToast(null), 3000)
                }}
                disabled={loading}
                className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors"
                aria-label={inCart ? 'Remove from liked' : 'Save to liked'}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${inCart ? 'text-red-500' : 'text-gray-500'}`}
                  fill={inCart ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            )}

            {/* Prev Arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.preventDefault(); setImgIndex(i => (i - 1 + images.length) % images.length) }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white"
                aria-label="Previous image"
              >
                <svg className="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}

            {/* Next Arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.preventDefault(); setImgIndex(i => (i + 1) % images.length) }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white"
                aria-label="Next image"
              >
                <svg className="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, i) => (
                  <span key={i} className={`block w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            )}

            {/* Condition Badge (if available) */}
            {listing.condition && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {listing.condition}
              </div>
            )}

            {/* Distance Badge (if available from radius filter) */}
            {listing.distance_miles !== undefined && (
              <div className="absolute bottom-1.5 right-2 bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white z-10">
                {listing.distance_miles < 1
                  ? '< 1 mi'
                  : `${listing.distance_miles.toFixed(1)} mi`
                }
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-4 space-y-2">
            {/* Title */}
            <h3 className="text-lg font-bold text-ume-indigo line-clamp-2 group-hover:text-ume-pink transition-colors">
              {listing.title}
            </h3>

            {/* Description */}
            {shortDescription && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {shortDescription}
              </p>
            )}

            {/* Price */}
            <p className="text-xl font-bold text-ume-indigo">
              {formatPrice(listing.price)}
            </p>

            {/* Seller Info (if available) */}
            {listing.user && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${listing.user_id}`) }}
                  className="flex items-center gap-2 hover:opacity-75 transition-opacity w-full text-left"
                >
                  <div className="w-6 h-6 bg-ume-indigo rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                    {(listing.user.username || listing.user.display_name)?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-ume-indigo font-medium truncate">
                    @{listing.user.username || listing.user.display_name}
                  </span>
                </button>
                {listing.user.college_name && (
                  <p className="text-xs text-gray-500 mt-1 ml-8 truncate">
                    {listing.user.college_name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Message Button — non-owners only */}
      {!isOwnListing && (
        <div className="p-4 pt-0">
          <button
            onClick={handleQuickMessage}
            disabled={quickMsgLoading}
            className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              quickMsgSent
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-ume-indigo text-white hover:bg-indigo-800'
            } ${quickMsgLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {quickMsgLoading ? 'Sending...' : quickMsgSent ? 'Message sent!' : 'Quick Message'}
          </button>
        </div>
      )}

      {/* Edit / Delete — own listings only */}
      {isOwnListing && (
        <div className="p-4 pt-0 flex gap-2">
          <Link
            href={`/edit/${listing.id}`}
            className="flex-1 text-center px-4 py-2 bg-ume-indigo text-white rounded-full text-sm font-medium hover:bg-indigo-800 transition-colors"
          >
            Edit
          </Link>
          <DeleteListingButton listingId={listing.id} />
        </div>
      )}
    </div>
  )
}
