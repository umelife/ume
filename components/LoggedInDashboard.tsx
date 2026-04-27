'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import { ShopIcon } from '@/components/homepage/SectionIcons'
import { animate, stagger, spring } from 'animejs'
import type { Listing } from '@/types/database'

interface Props {
  user: { id: string; display_name?: string; username?: string; college_name?: string }
  campusListings: Listing[]
  savedListings: Listing[]
  ownListings: Listing[]
  discoverListings: Listing[]
  totalListings: number
}

const QUICK_CATS = [
  { label: 'Books',     slug: 'books',                    icon: '📖' },
  { label: 'Tech',      slug: 'tech-and-gadgets',          icon: '💻' },
  { label: 'Clothes',   slug: 'clothing-and-accessories',  icon: '👕' },
  { label: 'Dorm',      slug: 'dorm-and-decor',            icon: '🛋' },
  { label: 'Fun',       slug: 'fun-and-craft',             icon: '🎨' },
  { label: 'Rides',     slug: 'transportation',            icon: '🚗' },
  { label: 'Free',      slug: 'giveaways',                 icon: '🎁' },
]

function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
}
function TagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
}
function SparkleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/><circle cx="12" cy="12" r="4"/></svg>
}

export default function LoggedInDashboard({ user, campusListings, savedListings, ownListings, discoverListings, totalListings }: Props) {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.display_name?.split(' ')[0] ?? user.username ?? 'there'
  const campus = user.college_name ?? 'Your campus'

  useEffect(() => {
    if (!heroRef.current) return
    const els = heroRef.current.querySelectorAll<HTMLElement>('.dash-in')
    animate(els, {
      translateY: [32, 0],
      opacity: [0, 1],
      delay: stagger(70, { start: 80 }),
      ease: spring({ stiffness: 240, damping: 18 }),
      duration: 750,
    })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(query.trim() ? `/marketplace?q=${encodeURIComponent(query.trim())}` : '/marketplace')
  }

  return (
    <div className="min-h-screen bg-[#f3f7f8]">

      {/* ══════════ HERO ══════════ */}
      <div
        ref={heroRef}
        className="relative overflow-hidden flex flex-col justify-between text-white"
        style={{
          minHeight: 'clamp(520px, 70vh, 680px)',
          background: 'linear-gradient(140deg, #1e1b4b 0%, #312e81 38%, #4338ca 68%, #7c3aed 100%)',
        }}
      >
        {/* Dot grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* Pink glow */}
        <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(250,158,188,0.28) 0%, transparent 65%)' }} />
        {/* Violet glow */}
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)' }} />

        {/* ── Top bar: greeting + campus ── */}
        <div className="relative z-10 px-5 sm:px-10 pt-8 max-w-4xl mx-auto w-full">
          <div className="dash-in flex items-center justify-between" style={{ opacity: 0 }}>
            <div>
              <p className="text-white/55 text-sm font-medium">{greeting},</p>
              <h1
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                {firstName} 👋
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-white/60 text-xs font-medium hidden sm:inline">{campus}</span>
            </div>
          </div>
        </div>

        {/* ── Centre: headline + search ── */}
        <div className="relative z-10 px-5 sm:px-10 max-w-4xl mx-auto w-full">
          <h2
            className="dash-in text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none mb-6"
            style={{ fontFamily: "'Archivo Black', sans-serif", opacity: 0 }}
          >
            What are you<br />
            <span className="text-ume-pink">looking for?</span>
          </h2>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="dash-in relative mb-5" style={{ opacity: 0 }}>
            <div className="relative flex items-center">
              <svg className="absolute left-4 w-5 h-5 text-white/50 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search textbooks, laptops, clothes…"
                className="w-full bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl pl-12 pr-32 py-4 text-white placeholder-white/45 text-base focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 bg-ume-pink hover:bg-pink-400 active:scale-95 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-lg shadow-pink-900/30"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category chips */}
          <div className="dash-in flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ opacity: 0 }}>
            {QUICK_CATS.map(cat => (
              <Link
                key={cat.slug}
                href={`/marketplace?category=${cat.slug}`}
                className="flex items-center gap-1.5 bg-white/12 hover:bg-white/22 border border-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/90 whitespace-nowrap active:scale-95 transition-all duration-150 shrink-0"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom: stat pills + actions ── */}
        <div className="relative z-10 px-5 sm:px-10 pb-8 max-w-4xl mx-auto w-full">
          <div className="dash-in flex flex-wrap items-center gap-3" style={{ opacity: 0 }}>
            {/* Stats */}
            <div className="flex items-center gap-1.5 text-white/55 text-xs">
              <span className="font-bold text-emerald-400">{totalListings.toLocaleString()}</span>
              active listings on UME
            </div>
            <span className="text-white/20 hidden sm:inline">·</span>
            {/* Action buttons */}
            <Link href="/create"
              className="flex items-center gap-1.5 bg-white text-ume-indigo text-sm font-bold px-5 py-2 rounded-full shadow-lg hover:bg-white/90 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              List Item
            </Link>
            <Link href="/messages"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-5 py-2 rounded-full border border-white/20 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
              </svg>
              Messages
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════ CONTENT ══════════ */}

      {/* Discover — always shows */}
      {discoverListings.length > 0 && (
        <HomeSectionRow title="Discover on UME" icon={<SparkleIcon />} viewAllHref="/marketplace" accentColor="bg-violet-600">
          {discoverListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Campus feed */}
      {campusListings.length > 0 && (
        <HomeSectionRow title={campus} icon={<ShopIcon />} viewAllHref="/marketplace" accentColor="bg-ume-indigo">
          {campusListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Saved */}
      {savedListings.length > 0 && (
        <HomeSectionRow title="Saved Items" icon={<HeartIcon />} viewAllHref="/cart" accentColor="bg-ume-pink">
          {savedListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      {/* Own listings */}
      {ownListings.length > 0 && (
        <HomeSectionRow title="Your Listings" icon={<TagIcon />} viewAllHref={`/profile/${user.id}`} accentColor="bg-emerald-600">
          {ownListings.map(l => <HomeListingCard key={l.id} listing={l} />)}
        </HomeSectionRow>
      )}

      <CategoryGrid />
    </div>
  )
}
