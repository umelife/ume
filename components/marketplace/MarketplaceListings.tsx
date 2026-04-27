'use client'

import { useRef, useState, useTransition } from 'react'
import ProductGrid from './ProductGrid'
import { fetchMoreListings, type ListingFilters } from '@/app/marketplace/actions'
import type { Listing } from '@/types/database'

interface MarketplaceListingsProps {
  initialListings: Listing[]
  hasMore: boolean
  filters: ListingFilters
}

export default function MarketplaceListings({
  initialListings,
  hasMore: initialHasMore,
  filters,
}: MarketplaceListingsProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleShowMore = () => {
    startTransition(async () => {
      const { listings: more, hasMore: moreAvailable } = await fetchMoreListings(filters, listings.length)
      setListings(prev => [...prev, ...more])
      setHasMore(moreAvailable)
      // Scroll the load-more button (and new content above it) into view
      requestAnimationFrame(() => {
        buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-16 w-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-black text-lg mt-4">No listings match your filters</p>
        <p className="text-black text-sm mt-2">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div>
      <ProductGrid listings={listings} />

      {/* Skeleton placeholders while loading more */}
      {isPending && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse">
              <div className="w-full pb-[100%] bg-gray-200" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                <div className="h-3 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            ref={buttonRef}
            onClick={handleShowMore}
            disabled={isPending}
            className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-ume-indigo text-ume-indigo font-semibold rounded-full hover:bg-ume-indigo hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
          >
            {isPending ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              'Show More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
