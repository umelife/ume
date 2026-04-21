/**
 * Homepage
 *
 * Server component: fetches recent marketplace listings via a cached
 * query (unstable_cache, 60 s TTL) and renders both the mobile and
 * desktop layouts with live data.
 *
 * Sections (top → bottom):
 *  1. Hero — animated hero with platform cards
 *  2. Stats bar — 5,000+ listings · .edu verified · 100% free
 *  3. Recent Marketplace — horizontal scroll of real listings
 *  4. Services — coming soon placeholder
 *  5. Communities — coming soon placeholder
 *  6. Events — coming soon placeholder
 *  7. Feature Slider — 3 USP cards
 *  8. Category Grid — browse by category
 *  9. CTA — join UME
 */

import { unstable_cache } from 'next/cache'
import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import { ShopIcon, ServiceIcon, CommunityIcon, EventIcon } from '@/components/homepage/SectionIcons'
import MobileHome from '@/components/MobileHome'
import Link from 'next/link'
import supabasePublic from '@/lib/supabase/public'
import type { Listing } from '@/types/database'

// ─── ISR: revalidate this page every 60 seconds ──────────────────────────────
export const revalidate = 60

// ─── Cached listing fetch ────────────────────────────────────────────────────

const getRecentListings = unstable_cache(
  async (): Promise<Listing[]> => {
    const { data } = await supabasePublic
      .from('listings')
      .select('*, user:users(*)')
      .not('status', 'in', '("sold","reserved")')
      .order('created_at', { ascending: false })
      .limit(10)
    return (data as Listing[]) ?? []
  },
  ['homepage-recent-listings'],
  { revalidate: 60, tags: ['listings'] }
)

// ─── Shared sections ─────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <div className="w-full bg-ume-indigo py-3 px-4">
      <div className="flex items-center justify-center gap-4 sm:gap-8 text-white text-xs sm:text-sm font-semibold tracking-wide flex-wrap">
        <span>5,000+ Listings</span>
        <span className="text-ume-pink text-base leading-none">•</span>
        <span>.edu Verified Only</span>
        <span className="text-ume-pink text-base leading-none">•</span>
        <span>100% Free</span>
      </div>
    </div>
  )
}

function CTASection() {
  return (
    <section className="w-full py-16 sm:py-20 bg-ume-indigo relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-ume-pink/10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <p className="text-ume-pink font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
          Ready to get started?
        </p>
        <h2 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white mb-5">
          JOIN UME TODAY
        </h2>
        <p className="text-white/70 text-base sm:text-lg mb-10 max-w-xl mx-auto">
          Buy, sell, and connect with verified students on your campus — completely free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-ume-pink text-white font-bold text-base rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-pink/50 shadow-pink"
          >
            Sign Up Free
          </Link>
          <Link
            href="/marketplace"
            className="inline-block px-10 py-4 border-2 border-white/40 text-white font-semibold text-base rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-105 focus:outline-none"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const recentListings = await getRecentListings()

  const marketplaceRow = recentListings.length > 0
    ? recentListings.map((listing) => <HomeListingCard key={listing.id} listing={listing} />)
    : <p className="text-sm text-gray-400 py-4">No listings yet — be the first to sell!</p>

  return (
    <>
      {/* ── MOBILE HOMEPAGE ── */}
      <div className="md:hidden">
        <MobileHome recentListings={recentListings} />
      </div>

      {/* ── DESKTOP HOMEPAGE ── */}
      <main className="hidden md:block min-h-screen bg-ume-bg">
        <Hero />
        <StatsBar />

        {/* Recent Marketplace */}
        <HomeSectionRow
          title="Marketplace"
          icon={<ShopIcon />}
          viewAllHref="/marketplace"
        >
          {marketplaceRow}
        </HomeSectionRow>

        {/* Services — coming soon */}
        <HomeSectionRow
          title="Services"
          icon={<ServiceIcon />}
          viewAllHref="/services"
          comingSoon
        />

        {/* Communities — coming soon */}
        <HomeSectionRow
          title="Communities"
          icon={<CommunityIcon />}
          viewAllHref="/communities"
          comingSoon
        />

        {/* Events — coming soon */}
        <HomeSectionRow
          title="Events"
          icon={<EventIcon />}
          viewAllHref="/events"
          comingSoon
        />

        <FeatureSlider autoPlayInterval={4000} />
        <CategoryGrid />
        <CTASection />
      </main>
    </>
  )
}
