/**
 * Homepage
 *
 * Server component: fetches recent marketplace listings via a cached
 * query (unstable_cache, 60 s TTL) and renders both the mobile and
 * desktop layouts with live data.
 *
 * Sections (top → bottom):
 *  1. Hero — headline, subheadline, two CTA buttons, indigo gradient bg
 *  2. Trust/Safety Banner — indigo strip with key trust points
 *  3. Recent Marketplace — horizontal scroll of real listings
 *  4. Communities — horizontal scroll of real communities
 *  5. How It Works — 3 steps in a horizontal row
 *  6. Category Grid — browse by category
 *  7. CTA — join UME
 */

import { unstable_cache } from 'next/cache'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import CommunityCard from '@/components/communities/CommunityCard'
import { ShopIcon, CommunityIcon } from '@/components/homepage/SectionIcons'
import MobileHome from '@/components/MobileHome'
import Hero from '@/components/homepage/Hero'
import Reviews from '@/components/homepage/Reviews'
import FAQ from '@/components/homepage/FAQ'
import LoggedInDashboard from '@/components/LoggedInDashboard'
import Link from 'next/link'
import supabasePublic from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { getCampusFromEmail } from '@/data/safe-points'
import type { Listing, Community } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import RemotionHeroPlayer from '@/components/remotion/RemotionHeroPlayer'

// Logged-in page is fully personalised — no ISR cache
// Logged-out page keeps the 60s ISR via getRecentListings unstable_cache

// ─── Cached listing fetch ────────────────────────────────────────────────────

const getRecentListings = unstable_cache(
  async (): Promise<Listing[]> => {
    const { data } = await supabasePublic
      .from('listings')
      .select('*, user:users!listings_user_id_fkey(*)')
      .not('status', 'in', '("sold","reserved")')
      .order('created_at', { ascending: false })
      .limit(10)
    return (data as Listing[]) ?? []
  },
  ['homepage-recent-listings'],
  { revalidate: 60, tags: ['listings'] }
)

const getRecentCommunities = unstable_cache(
  async (): Promise<Community[]> => {
    const { data } = await supabasePublic
      .from('communities')
      .select('*, creator:users!creator_id(id, username, display_name, avatar_url)')
      .eq('status', 'active')
      .order('member_count', { ascending: false })
      .limit(8)
    return (data as Community[]) ?? []
  },
  ['homepage-recent-communities'],
  { revalidate: 300, tags: ['communities'] }
)

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #130170 0%, #1d01a8 45%, #0a0040 100%)',
      }}
    >
      {/* Remotion animated background — client-only, plays in loop */}
      <RemotionHeroPlayer />

      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Soft pink glow top-left */}
      <div
        className="absolute -top-24 -left-12 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(250,158,188,0.18) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Soft lighter indigo glow bottom-right */}
      <div
        className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fa9ebc] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fa9ebc]" />
          </span>
          <span className="text-white/80 text-xs font-medium tracking-wide">
            Campus-only marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6 max-w-3xl mx-auto">
          Buy and sell within your{' '}
          <span style={{ color: '#fa9ebc' }}>campus community</span>
        </h1>

        {/* Subheadline */}
        <p className="text-white/65 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
          UME connects verified students to trade textbooks, electronics, furniture,
          and more — safely and for free.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/marketplace">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-3 rounded-full font-bold text-base shadow-lg hover:scale-105 transition-transform duration-200"
              style={{ background: '#fa9ebc', color: '#fff', border: 'none' }}
            >
              Browse Marketplace
            </Button>
          </Link>
          <Link href="/sell">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-3 rounded-full font-bold text-base border-2 text-white hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'transparent' }}
            >
              List an Item
            </Button>
          </Link>
        </div>

        {/* Social proof micro-stats */}
        <div className="flex items-center justify-center gap-6 mt-10 text-white/50 text-xs font-medium">
          <span>5,000+ listings</span>
          <span style={{ color: '#fa9ebc' }}>•</span>
          <span>.edu verified only</span>
          <span style={{ color: '#fa9ebc' }}>•</span>
          <span>100% free</span>
        </div>
      </div>
    </section>
  )
}

// ─── Trust / Safety Banner ────────────────────────────────────────────────────

function TrustBanner() {
  const points = [
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      ),
      text: 'Verified students only',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      ),
      text: 'Safe campus meetups',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      text: 'Campus-only access',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      text: 'Report & moderation tools',
    },
  ]

  return (
    <div
      className="w-full py-5 px-4"
      style={{ background: '#130170' }}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {points.map((point, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span style={{ color: '#fa9ebc' }}>{point.icon}</span>
            <span className="text-white text-sm font-medium">{point.text}</span>
            {i < points.length - 1 && (
              <span className="hidden sm:inline ml-4 sm:ml-6 text-white/20 text-lg leading-none select-none">|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Post your item',
      description:
        'Snap a photo, set a price, and post in under 2 minutes. Your listing goes live to your entire campus.',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Agree on a spot',
      description:
        'Chat directly with buyers or sellers. Decide on a convenient campus location that works for both of you.',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Safe exchange',
      description:
        'Meet at a familiar campus spot, hand over the item, done. No shipping, no strangers — just fellow students.',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      ),
    },
  ]

  return (
    <section className="w-full py-14 sm:py-20 bg-[#f3f7f8]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10">
        {/* Heading */}
        <div className="text-center mb-12">
          <Badge
            className="mb-4 font-semibold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full border-0"
            style={{ background: 'rgba(19,1,112,0.08)', color: '#130170' }}
          >
            Simple process
          </Badge>
          <h2
            className="font-black text-3xl sm:text-4xl tracking-tight mb-3"
            style={{ color: '#130170' }}
          >
            How it works
          </h2>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Trading on campus has never been easier or safer.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <Card
              key={i}
              className="relative border border-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow duration-200 bg-white"
            >
              <CardContent className="pt-8 pb-7 px-7">
                {/* Number badge */}
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-sm mb-5"
                  style={{ background: '#130170', color: '#fa9ebc' }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="mb-4"
                  style={{ color: '#130170' }}
                >
                  {step.icon}
                </div>

                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: '#130170' }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connector arrow — between cards, desktop only */}
              {i < steps.length - 1 && (
                <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm">
                  <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="w-full py-16 sm:py-20 relative overflow-hidden" style={{ background: '#130170' }}>
      {/* Decorative blobs */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(250,158,188,0.12) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-6 sm:px-10 text-center relative z-10">
        <p
          className="font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3"
          style={{ color: '#fa9ebc' }}
        >
          Ready to get started?
        </p>
        <h2 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white mb-5">
          Join UME Today
        </h2>
        <p className="text-white/65 text-base sm:text-lg mb-10 max-w-xl mx-auto">
          Buy, sell, and connect with verified students on your campus — completely free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-base hover:scale-105 transition-transform duration-200 shadow-lg"
              style={{ background: '#fa9ebc', color: '#fff', border: 'none' }}
            >
              Sign Up Free
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-base text-white hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'transparent' }}
            >
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  // Check auth first — logged-in users get a personalised dashboard
  const { user } = await getUser()

  if (user) {
    const supabase = await createClient()
    const campus = getCampusFromEmail(user.email)

    const [campusResult, savedResult, ownResult, discoverResult, statsResult] = await Promise.all([
      // Campus listings (other sellers on same campus)
      campus
        ? supabase
            .from('listings')
            .select('*, user:users!listings_user_id_fkey(*)')
            .eq('seller_campus_id', campus.id)
            .neq('user_id', user.id)
            .not('status', 'in', '(sold,reserved)')
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),

      // Saved / liked items
      supabase
        .from('saved_listings')
        .select('listing:listings!saved_listings_listing_id_fkey(*, user:users!listings_user_id_fkey(*))')
        .eq('user_id', user.id)
        .limit(6),

      // Own active listings
      supabase
        .from('listings')
        .select('*, user:users!listings_user_id_fkey(*)')
        .eq('user_id', user.id)
        .not('status', 'in', '(sold)')
        .order('created_at', { ascending: false })
        .limit(6),

      // Discover — recent listings across all campuses (always has content)
      supabase
        .from('listings')
        .select('*, user:users!listings_user_id_fkey(*)')
        .neq('user_id', user.id)
        .not('status', 'in', '(sold,reserved)')
        .order('created_at', { ascending: false })
        .limit(12),

      // Platform stats for the header
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '(sold,reserved)'),
    ])

    const campusListings = (campusResult.data ?? []) as Listing[]
    const savedListings = ((savedResult.data ?? []) as any[])
      .map(item => item.listing)
      .filter(Boolean) as Listing[]
    const ownListings = (ownResult.data ?? []) as Listing[]
    const discoverListings = (discoverResult.data ?? []) as Listing[]
    const totalListings = statsResult.count ?? 0

    return (
      <LoggedInDashboard
        user={{
          id: user.id,
          display_name: user.display_name,
          username: user.username,
          college_name: user.college_name,
        }}
        campusListings={campusListings}
        savedListings={savedListings}
        ownListings={ownListings}
        discoverListings={discoverListings}
        totalListings={totalListings}
      />
    )
  }

  // ── Logged-out: marketing landing page ──────────────────────────────────────
  const [recentListings, recentCommunities] = await Promise.all([
    getRecentListings(),
    getRecentCommunities(),
  ])

  const marketplaceRow =
    recentListings.length > 0
      ? recentListings.map((listing) => (
          <HomeListingCard key={listing.id} listing={listing} />
        ))
      : (
          <p className="text-sm text-gray-400 py-4">
            No listings yet — be the first to sell!
          </p>
        )

  const communitiesRow =
    recentCommunities.length > 0
      ? recentCommunities.map((c) => (
          <div key={c.id} className="w-44 sm:w-52 shrink-0">
            <CommunityCard community={c} />
          </div>
        ))
      : (
          <Link
            href="/communities"
            className="block py-4 text-sm text-ume-indigo font-semibold hover:underline"
          >
            Be the first to start a community →
          </Link>
        )

  return (
    <>
      {/* ── MOBILE HOMEPAGE ── */}
      <div className="md:hidden">
        <MobileHome
          recentListings={recentListings}
          recentCommunities={recentCommunities}
        />
      </div>

      {/* ── DESKTOP HOMEPAGE ── */}
      <main className="hidden md:block min-h-screen bg-[#f3f7f8]">
        {/* 1. Hero */}
        <Hero />

        {/* 2. Trust/Safety Banner */}
        <TrustBanner />

        {/* 3. Recent Marketplace */}
        <HomeSectionRow
          title="Marketplace"
          icon={<ShopIcon />}
          viewAllHref="/marketplace"
        >
          {marketplaceRow}
        </HomeSectionRow>

        {/* 4. Communities */}
        <HomeSectionRow
          title="Communities"
          icon={<CommunityIcon />}
          viewAllHref="/communities"
        >
          {communitiesRow}
        </HomeSectionRow>

        {/* 5. How It Works */}
        <HowItWorksSection />

        {/* 8. Feature Slider */}
        <FeatureSlider autoPlayInterval={4000} />

        {/* 9. Category Grid */}
        <CategoryGrid />

        {/* 10. Reviews */}
        <Reviews />

        {/* 11. FAQ */}
        <FAQ />

        {/* 12. CTA */}
        <CTASection />
      </main>
    </>
  )
}
