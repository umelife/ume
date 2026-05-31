/*
 * MOBILE-ONLY HOMEPAGE — md:hidden
 *
 * Receives recent marketplace listings as a prop from the server page.
 * Renders all sections in mobile-optimised layout using shadcn/ui + Remotion.
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import CommunityCard from '@/components/communities/CommunityCard'
import { ShopIcon, CommunityIcon } from '@/components/homepage/SectionIcons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { Listing, Community } from '@/types/database'

interface MobileHomeProps {
  recentListings: Listing[]
  recentCommunities: Community[]
}

export default function MobileHome({ recentListings, recentCommunities }: MobileHomeProps) {
  return (
    <div className="bg-ume-bg min-h-screen">
      <main className="min-h-screen pb-24">
        {/* Hero with Remotion animation */}
        <Hero />

        {/* Trust strip */}
        <div className="w-full bg-ume-indigo py-3 px-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[11px] font-semibold tracking-wide hover:bg-white/20">
              5,000+ Listings
            </Badge>
            <span className="text-ume-pink text-sm leading-none opacity-60">•</span>
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[11px] font-semibold tracking-wide hover:bg-white/20">
              .edu Verified
            </Badge>
            <span className="text-ume-pink text-sm leading-none opacity-60">•</span>
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[11px] font-semibold tracking-wide hover:bg-white/20">
              100% Free
            </Badge>
          </div>
        </div>

        {/* Recent Marketplace */}
        <HomeSectionRow
          title="Marketplace"
          icon={<ShopIcon />}
          viewAllHref="/marketplace"
        >
          {recentListings.length > 0 ? (
            recentListings.map((listing) => (
              <HomeListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 px-2">No listings yet — be the first to sell!</p>
          )}
        </HomeSectionRow>

        <Separator className="mx-4 my-0 opacity-40" />

        {/* Communities */}
        <HomeSectionRow
          title="Communities"
          icon={<CommunityIcon />}
          viewAllHref="/communities"
        >
          {recentCommunities.length > 0 ? (
            recentCommunities.map((c) => (
              <div key={c.id} className="w-44 shrink-0">
                <CommunityCard community={c} />
              </div>
            ))
          ) : (
            <Link href="/communities" className="block py-4 px-2 text-sm text-ume-indigo font-semibold">
              Be the first to start a community →
            </Link>
          )}
        </HomeSectionRow>


        {/* Feature Slider */}
        <FeatureSlider autoPlayInterval={4000} />

        {/* Category Grid */}
        <CategoryGrid />

        {/* CTA section */}
        <section className="w-full py-14 bg-ume-indigo relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-ume-pink/10 pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <p className="text-ume-pink font-semibold text-xs uppercase tracking-widest mb-3">
              Ready to get started?
            </p>
            <h2 className="font-black text-4xl uppercase tracking-tight text-white mb-4"
              style={{ fontFamily: 'var(--font-archivo-black), "Archivo Black", sans-serif' }}
            >
              JOIN UME TODAY
            </h2>
            <p className="text-white/70 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              Buy, sell, and connect with verified students on your campus — completely free.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button
                asChild
                size="lg"
                className="w-full max-w-xs rounded-full font-bold text-base shadow-pink hover:scale-105 transition-transform duration-200 border-0"
                style={{ background: '#fa9ebc', color: '#fff' }}
              >
                <Link href="/signup">Sign Up Free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full max-w-xs rounded-full font-semibold text-sm border-2 text-white hover:bg-white/10 hover:text-white transition-all duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'transparent' }}
              >
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
