import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import CategoryBar from '@/components/marketplace/CategoryBar'
import FiltersRow from '@/components/marketplace/FiltersRow'
import MobileFilterButton from '@/components/marketplace/MobileFilterButton'
import MobileFiltersWrapper from '@/components/marketplace/MobileFiltersWrapper'
import MarketplaceListings from '@/components/marketplace/MarketplaceListings'
import DeleteSuccessModal from '@/components/marketplace/DeleteSuccessModal'
import { getCategorySubtitle } from '@/lib/constants/categories'
import { CAMPUSES } from '@/data/safe-points'
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
}): Promise<{ listings: Listing[]; hasMore: boolean }> {
  const supabase = await createClient()

  const radius = searchParams.radius ? parseFloat(searchParams.radius) : null
  const userLat = searchParams.userLat ? parseFloat(searchParams.userLat) : null
  const userLng = searchParams.userLng ? parseFloat(searchParams.userLng) : null
  const categorySlug = searchParams.category
  const condition = searchParams.condition
  const campus = searchParams.campus
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : null
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null
  const sort = searchParams.sort || 'relevance'

  try {
    // CASE 1: Radius filtering
    if (radius && userLat && userLng) {
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
          .select('*, user:users(*)')
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
    }

    // CASE 2: Regular filtering
    let query = supabase
      .from('listings')
      .select('*, user:users(*)')
      .not('status', 'in', '(sold,reserved)')

    if (categorySlug) query = query.eq('category', categorySlugToDb(categorySlug))
    if (condition) query = query.eq('condition', condition)
    if (campus) query = query.eq('seller_campus_id', campus)
    if (minPrice !== null) query = query.gte('price', minPrice)
    if (maxPrice !== null) query = query.lte('price', maxPrice)

    switch (sort) {
      case 'price-asc': query = query.order('price', { ascending: true }); break
      case 'price-desc': query = query.order('price', { ascending: false }); break
      default: query = query.order('created_at', { ascending: false })
    }

    query = query.range(0, PAGE_SIZE - 1)

    const { data, error } = await query
    if (error) { console.error('Listings fetch error:', error); return { listings: [], hasMore: false } }

    return { listings: (data as Listing[]) ?? [], hasMore: (data?.length ?? 0) === PAGE_SIZE }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { listings: [], hasMore: false }
  }
}

async function fetchCampusOptions(): Promise<{ value: string; label: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
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
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams
  const [{ listings, hasMore }, campusOptions] = await Promise.all([
    fetchListings(params),
    fetchCampusOptions(),
  ])

  const categoryDisplay = getCategoryDisplay(params.category)
  const pageTitle = params.category ? `SHOP ${categoryDisplay.toUpperCase()}` : 'SHOP ALL'
  const pageSubtitle = getCategorySubtitle(categoryDisplay)

  const filters: ListingFilters = {
    category: params.category,
    condition: params.condition,
    campus: params.campus,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : null,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : null,
    sort: params.sort,
  }

  return (
    <div className="min-h-screen bg-ume-bg">
      <Suspense fallback={null}>
        <DeleteSuccessModal />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-ume-indigo mb-1">{pageTitle}</h1>
          <p className="text-sm text-gray-600">{pageSubtitle}</p>
        </div>

        <CategoryBar currentCategory={params.category} />

        <MobileFilterButton />

        <Suspense fallback={<div className="h-20 bg-white rounded-lg animate-pulse" />}>
          <FiltersRow
            currentCondition={params.condition}
            currentSort={params.sort}
            currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
            currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
            currentCampus={params.campus}
            campusOptions={campusOptions}
          />
        </Suspense>

        <MobileFiltersWrapper
          currentCondition={params.condition}
          currentSort={params.sort}
          currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
          currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
          currentCampus={params.campus}
          campusOptions={campusOptions}
        />

        <div className="mt-4 mb-3 text-sm text-black">
          {listings.length === 0 ? 'No listings found' : `Showing ${listings.length} listing${listings.length === 1 ? '' : 's'}`}
        </div>

        {/* Key resets state when filters change */}
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
