/**
 * HomeListingCard
 * Compact listing card designed for horizontal-scroll sections on the homepage.
 * Shows: image, price badge, title, category.
 */

import Link from 'next/link'
import Image from 'next/image'
import type { Listing } from '@/types/database'

export default function HomeListingCard({ listing }: { listing: Listing }) {
  const imageUrl = listing.image_urls?.[0] ?? null
  const dollars = listing.price / 100
  const formattedPrice =
    dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`

  return (
    <Link
      href={`/item/${listing.id}`}
      className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer focus:outline-none"
    >
      {/* Image container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-2.5 shadow-sm">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 160px, 192px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="w-10 h-10 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-2 left-2">
          <span className="text-xs bg-ume-indigo text-white font-bold px-2.5 py-1 rounded-full shadow-md">
            {formattedPrice}
          </span>
        </div>

        {/* Condition badge */}
        {listing.condition && listing.condition !== 'Used' && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] bg-white/90 text-ume-indigo font-semibold px-1.5 py-0.5 rounded-full">
              {listing.condition}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <p className="text-xs text-ume-indigo font-semibold line-clamp-2 leading-snug mb-0.5 px-0.5">
        {listing.title}
      </p>
      <p className="text-[11px] text-gray-400 px-0.5">{listing.category}</p>
    </Link>
  )
}
