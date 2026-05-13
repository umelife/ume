import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Browse and buy items listed by students on your campus — textbooks, dorm supplies, tech, clothing and more.',
  alternates: { canonical: '/marketplace' },
  openGraph: {
    title: 'UME Marketplace',
    description: 'Browse campus listings — textbooks, dorm supplies, tech, clothing and more.',
  },
}
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import supabasePublic from '@/lib/supabase/public'
import CategoryBar from '@/components/marketplace/CategoryBar'
import FiltersRow from '@/components/marketplace/FiltersRow'
import MobileFilterButton from '@/components/marketplace/MobileFilterButton'
import MobileFiltersWrapper from '@/components/marketplace/MobileFiltersWrapper'
import MarketplaceListings from '@/components/marketplace/MarketplaceListings'
import DeleteSuccessModal from '@/components/marketplace/DeleteSuccessModal'
import { getCategorySubtitle } from '@/lib/constants/categories'
import { CAMPUSES } from '@/data/safe-points'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { Listing } from '@/types/database'
import type { ListingFilters } from './actions'

const PAGE_SIZE = 20

interface MarketplacePageProps {
  searchParams: Promise<{
    category?: string
    radius?: string
    userLat?: string
    userLng?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    campus?: string
    q?: string
  }>
}

const CATEGORIES = [
  { slug: 'dorm-and-decor', display: 'Dorm & Decor' },
  { slug: 'fun-and-craft', display: 'Fun & Craft' },
  { slug: 'books', display: 'Books' },
  { slug: 'clothing-and-accessories', display: 'Clothing & Accessories' },
  { slug: 'transportation', display: 'Transportation' },
  { slug: 'tech-and-gadgets', display: 'Tech & Gadgets' },
  { slug: 'giveaways', display: 'Giveaways' },
  { slug: 'other', display: 'Other' },
]

function getCategoryDisplay(slug: string | undefined): string {
  if (!slug) return 'all'
  const category = CATEGORIES.find(c => c.slug === slug)
  return category ? category.display : slug
}

function categorySlugToDb(slug: string): string {
  const map: Record<string, string> = {
    'dorm-and-decor': 'Dorm and Decor',
    'fun-and-craft': 'Fun and Craft',
    'books': 'Books',
    'clothing-and-accessories': 'Clothing and Accessories',
    'transportation': 'Transportation',
    'tech-and-gadgets': 'Tech and Gadgets',
    'giveaways': 'Giveaways',
    'other': 'Other',
  }
  return map[slug] || slug
}

// ─── Campus options — cached 5 minutes (changes very rarely) ─────────────────

const fetchCampusOptions = unstable_cache(
  async (): Promise<{ value: string; label: string }[]> => {
    const { data } = await supabasePublic
      .from('listings')
      .select('seller_campus_id')
      .not('status', 'in', '(sold,reserved)')
      .not('seller_campus_id', 'is', null)

    if (!data) return []

    const counts: Record<string, number> = {}
    for (const row of data) {
      if (row.seller_campus_id) counts[row.seller_campus_id] = (counts[row.seller_campus_id] || 0) + 1
    }

    return Object.entries(counts)
      .map(([id, count]) => {
        const campus = CAMPUSES.find(c => c.id === id)
        return campus ? { value: id, label: `${campus.name} (${count})` } : null
      })
      .filter(Boolean) as { value: string; label: string }[]
  },
  ['marketplace-campus-options'],
  { revalidate: 300, tags: ['listings'] }   // 5 minutes
)

// ─── Cacheable regular-filter fetch (no user location involved) ───────────────

const fetchListingsCached = unstable_cache(
  async (params: {
    category?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    campus?: string
    q?: string
  }): Promise<{ listings: Listing[]; hasMore: boolean }> => {
    const categorySlug = params.category
    const condition = params.condition
    const campus = params.campus
    const q = params.q
    const minPrice = params.minPrice ? parseFloat(params.minPrice) : null
    const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null
    const sort = params.sort || 'relevance'

    let query = supabasePublic
      .from('listings')
      .select('*, user:users!listings_user_id_fkey(*)')
      .not('status', 'in', '(sold,reserved)')

    if (categorySlug) query = query.eq('category', categorySlugToDb(categorySlug))
    if (condition) query = query.eq('condition', condition)
    if (campus) query = query.eq('seller_campus_id', campus)
    if (minPrice !== null) query = query.gte('price', minPrice)
    if (maxPrice !== null) query = query.lte('price', maxPrice)
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

    switch (sort) {
      case 'price-asc': query = query.order('price', { ascending: true }); break
      case 'price-desc': query = query.order('price', { ascending: false }); break
      default: query = query.order('created_at', { ascending: false })
    }

    query = query.range(0, PAGE_SIZE - 1)

    const { data, error } = await query
    if (error) { console.error('Listings fetch error:', error); return { listings: [], hasMore: false } }
    return { listings: (data as Listing[]) ?? [], hasMore: (data?.length ?? 0) === PAGE_SIZE }
  },
  ['marketplace-listings'],
  { revalidate: 30, tags: ['listings'] }   // 30 seconds
)

// ─── Full fetch (radius path stays uncached — user coords are unique) ─────────

async function fetchListings(searchParams: {
  category?: string
  radius?: string
  userLat?: string
  userLng?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  campus?: string
  q?: string
}): Promise<{ listings: Listing[]; hasMore: boolean }> {
  const radius = searchParams.radius ? parseFloat(searchParams.radius) : null
  const userLat = searchParams.userLat ? parseFloat(searchParams.userLat) : null
  const userLng = searchParams.userLng ? parseFloat(searchParams.userLng) : null

  // Radius queries contain user GPS coords — serve fresh, no cache.
  if (radius && userLat && userLng) {
    const supabase = await createClient()
    const categorySlug = searchParams.category
    const condition = searchParams.condition
    const campus = searchParams.campus
    const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : null
    const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null
    const sort = searchParams.sort || 'relevance'

    try {
      const dbCategory = categorySlug ? categorySlugToDb(categorySlug) : null
      const { data, error } = await supabase.rpc('filter_by_radius', {
        user_lat: userLat,
        user_lng: userLng,
        radius_miles: radius,
        category_filter: dbCategory,
      })

      if (error) { console.error('Radius fetch error:', error); return { listings: [], hasMore: false } }

      let filteredData = data || []
      if (condition) filteredData = filteredData.filter((l: any) => l.condition === condition)
      if (minPrice !== null) filteredData = filteredData.filter((l: any) => l.price >= minPrice)
      if (maxPrice !== null) filteredData = filteredData.filter((l: any) => l.price <= maxPrice)
      if (campus) filteredData = filteredData.filter((l: any) => l.seller_campus_id === campus)

      const listingIds = filteredData.slice(0, PAGE_SIZE).map((l: any) => l.id)
      const hasMore = filteredData.length > PAGE_SIZE

      if (listingIds.length > 0) {
        const { data: listingsWithUsers } = await supabase
          .from('listings')
          .select('*, user:users!listings_user_id_fkey(*)')
          .in('id', listingIds)
          .not('status', 'in', '(sold,reserved)')

        if (listingsWithUsers) {
          let merged = listingsWithUsers.map(listing => ({
            ...listing,
            distance_miles: filteredData.find((l: any) => l.id === listing.id)?.distance_miles,
          }))
          switch (sort) {
            case 'price-asc': merged.sort((a, b) => a.price - b.price); break
            case 'price-desc': merged.sort((a, b) => b.price - a.price); break
            default: merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          }
          return { listings: merged as Listing[], hasMore }
        }
      }

      return { listings: filteredData as Listing[], hasMore }
    } catch (err) {
      console.error('Radius fetch error:', err)
      return { listings: [], hasMore: false }
    }
  }

  // Standard filter — served from cache.
  return fetchListingsCached({
    category: searchParams.category,
    condition: searchParams.condition,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    sort: searchParams.sort,
    campus: searchParams.campus,
    q: searchParams.q,
  })
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams
  const [{ listings, hasMore }, campusOptions] = await Promise.all([
    fetchListings(params),
    fetchCampusOptions(),
  ])

  const categoryDisplay = getCategoryDisplay(params.category)
  const pageTitle = params.q
    ? `RESULTS FOR "${params.q.toUpperCase()}"`
    : params.category ? `SHOP ${categoryDisplay.toUpperCase()}` : 'SHOP ALL'
  const pageSubtitle = params.q ? `${listings.length} matching listing${listings.length === 1 ? '' : 's'}` : getCategorySubtitle(categoryDisplay)

  const filters: ListingFilters = {
    category: params.category,
    condition: params.condition,
    campus: params.campus,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : null,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : null,
    sort: params.sort,
    q: params.q,
  }

  const activeFilterCount = [
    params.condition,
    params.campus,
    params.minPrice || params.maxPrice,
    params.sort && params.sort !== 'relevance',
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-ume-bg">
      <Suspense fallback={null}>
        <DeleteSuccessModal />
      </Suspense>

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-5">
            <h1 className="font-heading text-3xl sm:text-4xl text-ume-indigo tracking-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="mt-1 text-sm text-gray-500">{pageSubtitle}</p>
            )}
          </div>

          {/* Category chips */}
          <CategoryBar currentCategory={params.category} />
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* ── Desktop: filters row above grid ── */}
        <Suspense
          fallback={
            <div className="hidden md:flex items-center gap-2 mb-5">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          }
        >
          <FiltersRow
            currentCondition={params.condition}
            currentSort={params.sort}
            currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
            currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
            currentCampus={params.campus}
            campusOptions={campusOptions}
            currentRadius={params.radius ? parseFloat(params.radius) : undefined}
            userLat={params.userLat ? parseFloat(params.userLat) : undefined}
            userLng={params.userLng ? parseFloat(params.userLng) : undefined}
          />
        </Suspense>

        {/* ── Mobile: filter button ── */}
        <div className="md:hidden mb-4">
          <MobileFilterButton />
        </div>

        {/* ── Mobile filters drawer ── */}
        <MobileFiltersWrapper
          currentCondition={params.condition}
          currentSort={params.sort}
          currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
          currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
          currentCampus={params.campus}
          campusOptions={campusOptions}
          currentRadius={params.radius ? parseFloat(params.radius) : undefined}
          userLat={params.userLat ? parseFloat(params.userLat) : undefined}
          userLng={params.userLng ? parseFloat(params.userLng) : undefined}
        />

        {/* ── Results meta ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {listings.length === 0
              ? 'No listings found'
              : (
                <>
                  <span className="font-semibold text-ume-indigo">{listings.length}</span>
                  {' '}listing{listings.length === 1 ? '' : 's'}
                  {activeFilterCount > 0 && (
                    <span className="text-gray-400"> · {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied</span>
                  )}
                </>
              )
            }
          </p>
        </div>

        <Separator className="mb-5 bg-gray-200" />

        {/* ── Listings grid ── */}
        <MarketplaceListings
          key={JSON.stringify(filters)}
          initialListings={listings}
          hasMore={hasMore}
          filters={filters}
        />
      </div>
    </div>
  )
}
