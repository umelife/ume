'use server'

import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

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

export interface ListingFilters {
  category?: string
  condition?: string
  campus?: string
  minPrice?: number | null
  maxPrice?: number | null
  sort?: string
  q?: string
}

export async function fetchMoreListings(
  filters: ListingFilters,
  offset: number
): Promise<{ listings: any[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { category, condition, campus, minPrice, maxPrice, sort = 'relevance', q } = filters

  let query = supabase
    .from('listings')
    .select('*, user:users(*)')
    .not('status', 'in', '(sold,reserved)')

  if (category) query = query.eq('category', categorySlugToDb(category))
  if (condition) query = query.eq('condition', condition)
  if (campus) query = query.eq('seller_campus_id', campus)
  if (minPrice != null) query = query.gte('price', minPrice)
  if (maxPrice != null) query = query.lte('price', maxPrice)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  switch (sort) {
    case 'price-asc': query = query.order('price', { ascending: true }); break
    case 'price-desc': query = query.order('price', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data, error } = await query
  if (error) {
    console.error('fetchMoreListings error:', error)
    return { listings: [], hasMore: false }
  }

  return { listings: data ?? [], hasMore: (data?.length ?? 0) === PAGE_SIZE }
}
