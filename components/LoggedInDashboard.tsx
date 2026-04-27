'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import { ShopIcon } from '@/components/homepage/SectionIcons'
import { animate, stagger, spring } from 'animejs'
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
  discoverListings: Listing[]
  totalListings: number
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

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  )
}

export default function LoggedInDashboard({
  user, campusListings, savedListings, ownListings, discoverListings, totalListings
}: Props) {
  const headerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.display_name?.split(' ')[0] ?? user.username ?? 'there'
  const campus = user.college_name ?? 'Your campus'

  const hasCampus = campusListings.length > 0
  const hasSaved = savedListings.length > 0
  const hasOwn = ownListings.length > 0

  // Animate header elements on mount
  useEffect(() => {
    if (!headerRef.current) return
    const els = headerRef.current.querySelectorAll<HTMLElement>('.dash-in')
    animate(els, {
      translateY: [24, 0],
      opacity: [0, 1],
      delay: stagger(60, { start: 100 }),
      ease: spring({ stiffness: 260, damping: 20 }),
      duration: 700,
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#f3f7f8]">

      {/* ── Hero header ── */}
      <div
        ref={headerRef}
        className="relative overflow-hidden text-white px-5 sm:px-10 pt-10 pb-14"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #7c3aed 100%)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* Pink glow top-right */}
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(250,158,188,0.3) 0%, transparent 65%)' }} />
        {/* Violet glow bottom-left */}
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Greeting */}
          <p className="dash-in text-white/60 text-sm font-medium mb-1" style={{ opacity: 0 }}>{greeting},</p>
          <h1
            className="dash-in text-4xl sm:text-5xl font-black uppercase tracking-tight mb-1"
            style={{ fontFamily: "'Archivo Black', sans-serif", opacity: 0 }}
          >
            {firstName} <span className="inline-block animate-bounce-slow">👋</span>
          </h1>

          {/* Campus badge */}
          <div className="dash-in flex items-center gap-2 mb-6" style={{ opacity: 0 }}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-white/70 text-sm font-medium">{campus}</span>
          </div>

          {/* Stat pills */}
          <div className="dash-in flex flex-wrap gap-2 mb-7" style={{ opacity: 0 }}>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
              <span className="text-emerald-400 text-xs font-bold">{totalListings.toLocaleString()}</span>
              <span className="text-white/60 text-xs">active listings</span>
            </div>
            {hasOwn && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                <span className="text-ume-pink text-xs font-bold">{ownListings.length}</span>
                <span className="text-white/60 text-xs">your listings</span>
              </div>
            )}
            {hasSaved && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                <span className="text-pink-300 text-xs font-bold">{savedListings.length}</span>
                <span className="text-white/60 text-xs">saved</span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="dash-in flex flex-wrap gap-2.5" style={{ opacity: 0 }}>
            <Link href="/create"
              className="flex items-center gap-1.5 bg-ume-pink text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-pink-900/40 hover:bg-pink-400 active:scale-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              List Item
            </Link>
            <Link href="/messages"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/20 active:scale-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
              </svg>
              Messages
            </Link>
            <Link href="/marketplace"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/20 active:scale-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Browse
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content sections ── */}

      {/* Campus feed */}
      {hasCampus && (
        <HomeSectionRow title={campus} icon={<ShopIcon />} viewAllHref="/marketplace" accentColor="bg-ume-indigo">
          {campusListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Saved items */}
      {hasSaved && (
        <HomeSectionRow title="Saved Items" icon={<HeartIcon />} viewAllHref="/cart" accentColor="bg-ume-pink">
          {savedListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Own listings */}
      {hasOwn && (
        <HomeSectionRow title="Your Listings" icon={<TagIcon />} viewAllHref={`/profile/${user.id}`} accentColor="bg-emerald-600">
          {ownListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Discover — always shows regardless of campus/saved state */}
      {discoverListings.length > 0 && (
        <HomeSectionRow title="Discover on UME" icon={<SparkleIcon />} viewAllHref="/marketplace" accentColor="bg-violet-600">
          {discoverListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Categories */}
      <CategoryGrid />
    </div>
  )
}
