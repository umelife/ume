'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Listing } from '@/types/database'
import { formatPrice } from '@/lib/utils/helpers'
import useCart from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'

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

interface ProductGridProps {
  listings: Listing[]
}

export default function ProductGrid({ listings }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

function ProductCard({ listing }: { listing: Listing }) {
  const images = listing.image_urls?.length ? listing.image_urls : ['/placeholder-image.jpg']
  const { isInCart, addToCart, removeFromCart, loadingIds } = useCart()
  const inCart = isInCart(listing.id)
  const loading = loadingIds[listing.id] === true

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const [imgIndex, setImgIndex] = useState(0)

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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <Link href={`/item/${listing.id}`} className="group flex-1">
        <div>
          {/* Square Image Container */}
          <div className="relative w-full pb-[100%] bg-gray-200 overflow-hidden">
            <img
              src={images[imgIndex]}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />

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
              <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
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
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                    {listing.user.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 truncate">
                    @{listing.user.username || listing.user.display_name}
                  </span>
                </div>
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
      {!isOwnListing && (
        <div className="p-4 pt-0">
          <button
            onClick={(e) => {
              e.preventDefault()
              if (inCart) removeFromCart(listing.id)
              else addToCart(listing.id)
            }}
            disabled={loading}
            aria-pressed={inCart}
            className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              inCart ? 'bg-white border-2 border-ume-indigo text-ume-indigo hover:bg-gray-50' : 'bg-ume-indigo text-white hover:bg-indigo-800'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Working...' : (inCart ? 'Remove from liked' : 'Save to liked')}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Alternative: Using aspect-ratio utility (if Tailwind v3.0+ with aspect-ratio plugin)
 *
 * If you prefer Tailwind's aspect-ratio utilities, replace the image container with:
 *
 * <div className="relative aspect-square bg-gray-200 overflow-hidden">
 *   <img
 *     src={imageUrl}
 *     alt={listing.title}
 *     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
 *     loading="lazy"
 *   />
 * </div>
 *
 * Note: aspect-square requires @tailwindcss/aspect-ratio plugin or Tailwind 3.0+
 */
