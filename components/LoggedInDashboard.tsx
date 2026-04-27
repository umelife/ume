/**
 * LoggedInDashboard
 * Personalised homepage shown to authenticated users.
 * Replaces the marketing hero with a greeting, quick actions,
 * campus feed, saved items, and their own listings.
 */

import Link from 'next/link'
import Image from 'next/image'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import { ShopIcon } from '@/components/homepage/SectionIcons'
import type { Listing } from '@/types/database'

interface Props {
  user: {
    id: string
    display_name?: string
    username?: string
    college_name?: string
  }
  campusListings: Listing[]
  savedListings: Listing[]
  ownListings: Listing[]
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

export default function LoggedInDashboard({ user, campusListings, savedListings, ownListings }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.display_name?.split(' ')[0] ?? user.username ?? 'there'
  const campus = user.college_name ?? 'Your campus'

  const hasCampus = campusListings.length > 0
  const hasSaved = savedListings.length > 0
  const hasOwn = ownListings.length > 0
  const isEmpty = !hasCampus && !hasSaved && !hasOwn

  return (
    <div className="min-h-screen bg-[#f3f7f8]">

      {/* ── Greeting header ── */}
      <div className="bg-ume-indigo text-white px-5 sm:px-10 pt-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/60 text-sm font-medium mb-0.5">{greeting},</p>
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            {firstName} 👋
          </h1>
          <p className="text-white/50 text-sm mt-1">{campus}</p>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link
              href="/create"
              className="flex items-center gap-1.5 bg-ume-pink text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-md shadow-pink-900/20 hover:bg-pink-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              List Item
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
              </svg>
              Messages
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Saved
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>
              </svg>
              Browse
            </Link>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="max-w-7xl mx-auto px-5 py-12 text-center">
          <p className="text-gray-400 text-sm">No listings on your campus yet — be the first to sell something!</p>
          <Link href="/create" className="inline-block mt-4 bg-ume-indigo text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-colors">
            + List your first item
          </Link>
        </div>
      )}

      {/* ── Campus feed ── */}
      {hasCampus && (
        <HomeSectionRow
          title={`${campus}`}
          icon={<ShopIcon />}
          viewAllHref="/marketplace"
          accentColor="bg-ume-indigo"
        >
          {campusListings.map(listing => (
            <HomeListingCard key={listing.id} listing={listing} />
          ))}
        </HomeSectionRow>
      )}

      {/* ── Saved items ── */}
      {hasSaved && (
        <HomeSectionRow
          title="Saved Items"
          icon={<HeartIcon />}
          viewAllHref="/cart"
          accentColor="bg-ume-pink"
        >
          {savedListings.map(listing => (
            <HomeListingCard key={listing.id} listing={listing} />
          ))}
        </HomeSectionRow>
      )}

      {/* ── Your listings ── */}
      {hasOwn && (
        <HomeSectionRow
          title="Your Listings"
          icon={<TagIcon />}
          viewAllHref={`/profile/${user.id}`}
          accentColor="bg-emerald-600"
        >
          {ownListings.map(listing => (
            <HomeListingCard key={listing.id} listing={listing} />
          ))}
        </HomeSectionRow>
      )}

      {/* ── Categories ── */}
      <CategoryGrid />
    </div>
  )
}
