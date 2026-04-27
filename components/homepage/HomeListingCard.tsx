/**
 * HomeListingCard
 * Compact listing card designed for horizontal-scroll sections on the homepage.
 * Built with shadcn Card, Badge, and Avatar components.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Listing } from '@/types/database'

export default function HomeListingCard({ listing }: { listing: Listing }) {
  const imageUrl = listing.image_urls?.[0] ?? null
  const dollars = listing.price / 100
  const formattedPrice =
    dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`

  const seller = listing.user
  const sellerInitials = seller?.display_name
    ? seller.display_name.slice(0, 2).toUpperCase()
    : '??'
  const campus = seller?.college_name ?? null

  return (
    <Link
      href={`/item/${listing.id}`}
      className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#130170] focus-visible:ring-offset-2 rounded-2xl"
    >
      <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl group-active:scale-[0.97]">
        {/* Image */}
        <div className="relative w-full aspect-square bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              loading="lazy"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Image gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />

          {/* Price badge — indigo, bottom-left */}
          <Badge
            className="absolute bottom-2 left-2 bg-[#130170] text-white border-0 shadow-lg text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none z-20"
          >
            {formattedPrice}
          </Badge>

          {/* Condition badge — top-right, only for non-Used */}
          {listing.condition && listing.condition !== 'Used' && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 bg-white/90 text-[#130170] border-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full pointer-events-none backdrop-blur-sm"
            >
              {listing.condition}
            </Badge>
          )}
        </div>

        <CardContent className="p-2.5 pt-2">
          {/* Title */}
          <p className="text-xs text-[#130170] font-semibold line-clamp-2 leading-snug mb-1.5">
            {listing.title}
          </p>

          {/* Seller row */}
          {seller && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Avatar className="h-4 w-4 shrink-0">
                <AvatarImage src={undefined} alt={seller.display_name} />
                <AvatarFallback className="bg-[#fa9ebc]/20 text-[#130170] text-[8px] font-bold">
                  {sellerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-gray-500 truncate">
                {seller.display_name}
              </span>
            </div>
          )}

          {/* Category */}
          <p className="text-[10px] text-gray-400 truncate">{listing.category}</p>

          {/* Campus tag */}
          {campus && (
            <div className="mt-1.5">
              <Badge
                variant="outline"
                className="text-[9px] border-[#130170]/20 text-[#130170]/60 px-1.5 py-0 rounded-full font-medium bg-transparent truncate max-w-full"
              >
                {campus}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
