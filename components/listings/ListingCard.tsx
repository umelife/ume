'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Listing } from '@/types/database'
import { formatPrice, getTimeAgo } from '@/lib/utils/helpers'
import useCart from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'

export default function ListingCard({ listing }: { listing: Listing }) {
  const imageUrl = listing.image_urls?.[0] || '/placeholder-image.png'
  const { isInCart, addToCart, removeFromCart, loadingIds } = useCart()
  const inCart = isInCart(listing.id)
  const loading = loadingIds[listing.id] === true

  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  // Check if this is the user's own listing
  const isOwnListing = currentUserId && listing.user_id === currentUserId

  return (
    <div className="animate-materialize bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-[shadow,transform] duration-200">
      <Link href={`/item/${listing.id}`}>
        <div>
          <div className="relative h-48 bg-gray-200">
            {listing.image_urls && listing.image_urls.length > 0 ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) calc(50vw - 16px), (max-width: 1024px) calc(33vw - 16px), calc(25vw - 16px)"
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
            {listing.condition && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {listing.condition}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg text-ume-indigo mb-1 truncate">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
              {listing.description}
            </p>
            <p className="text-ume-indigo font-bold text-xl mb-2">
              {formatPrice(listing.price)}
            </p>
            {listing.user && (
              <div className="mb-2">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${listing.user_id}`) }}
                  className="text-sm text-ume-indigo font-medium hover:text-ume-pink transition-colors"
                >
                  @{listing.user.username || listing.user.display_name}
                </button>
                {listing.user.college_name && (
                  <p className="text-xs text-gray-600">
                    {listing.user.college_name}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-black mb-3">
              <span className="bg-gray-100 px-2 py-1 rounded-full">
                {listing.category}
              </span>
              <span>{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
      {!isOwnListing && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault()
              if (inCart) removeFromCart(listing.id)
              else addToCart(listing.id)
            }}
            disabled={loading}
            aria-pressed={inCart}
            className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-[colors,transform] duration-150 active:scale-[0.97] ${
              inCart ? 'bg-white border border-black text-black hover:bg-gray-50' : 'bg-black text-white hover:bg-gray-800'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Working...' : (inCart ? 'Remove from liked' : 'Save to liked')}
          </button>
        </div>
      )}
    </div>
  )
}
