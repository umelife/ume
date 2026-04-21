/*
 * MOBILE-ONLY HOMEPAGE — md:hidden
 *
 * Receives recent marketplace listings as a prop from the server page.
 * Renders all sections in mobile-optimised layout.
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import { ShopIcon, ServiceIcon, CommunityIcon, EventIcon } from '@/components/homepage/SectionIcons'
import Link from 'next/link'
import type { Listing } from '@/types/database'

interface MobileHomeProps {
  recentListings: Listing[]
}

export default function MobileHome({ recentListings }: MobileHomeProps) {
  return (
    <div className="bg-ume-bg min-h-screen">
      <main className="min-h-screen pb-24">
        <Hero />

        {/* Stats Bar */}
        <div className="w-full bg-ume-indigo py-3 px-4">
          <div className="flex items-center justify-center gap-4 text-white text-xs font-semibold tracking-wide flex-wrap">
            <span>5,000+ Listings</span>
            <span className="text-ume-pink text-base leading-none">•</span>
            <span>.edu Verified</span>
            <span className="text-ume-pink text-base leading-none">•</span>
            <span>100% Free</span>
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
            <p className="text-sm text-gray-400 py-4">No listings yet — be the first to sell!</p>
          )}
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

        {/* Feature Slider */}
        <FeatureSlider autoPlayInterval={4000} />

        {/* Category Grid */}
        <CategoryGrid />

        {/* CTA */}
        <section className="w-full py-14 bg-ume-indigo relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-ume-pink/10 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <p className="text-ume-pink font-semibold text-xs uppercase tracking-widest mb-3">
              Ready to get started?
            </p>
            <h2 className="font-black text-4xl uppercase tracking-tight text-white mb-4">
              JOIN UME TODAY
            </h2>
            <p className="text-white/70 text-sm mb-8 max-w-sm mx-auto">
              Buy, sell, and connect with verified students on your campus — completely free.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                href="/signup"
                className="inline-block w-full max-w-xs px-8 py-4 bg-ume-pink text-white font-bold text-base rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none shadow-pink"
              >
                Sign Up Free
              </Link>
              <Link
                href="/marketplace"
                className="inline-block w-full max-w-xs px-8 py-3 border-2 border-white/40 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
