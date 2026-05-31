import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { COLLEGES } from '@/data/colleges'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .not('status', 'in', '(sold,reserved)')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `https://ume-life.com/item/${l.id}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [
    { url: 'https://ume-life.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://ume-life.com/marketplace', lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: 'https://ume-life.com/communities', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://ume-life.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://ume-life.com/safety', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://ume-life.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...listingUrls,
    ...COLLEGES.map(c => ({
      url: `https://ume-life.com/campus/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
