'use client'

/**
 * Hero Component — interactive, mobile-first.
 *
 * Mobile layout (single column):
 *  1. Eyebrow badge
 *  2. Headline (cycling animated word)
 *  3. Platform cards 2×2 grid — VISIBLE IN FIRST VIEWPORT
 *  4. Subtitle + CTAs
 *
 * Desktop layout (two columns):
 *  Left: eyebrow, headline, subtitle, CTAs
 *  Right: larger platform cards grid
 *
 * Animations:
 *  - Blurred colour blobs drifting in background
 *  - Dot-grid overlay
 *  - Staggered slide-up entrance
 *  - Headline cycling word with slide + colour transition
 *  - Marketplace card shine sweep + live dot ping
 *  - Scroll hint arrow on mobile
 *  - prefers-reduced-motion respected in globals.css
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { animate, stagger, spring } from 'animejs'

// ─── Cycling words ────────────────────────────────────────────────────────────

const WORDS = [
  { label: 'MARKETPLACE', color: '#fa9ebc' },
  { label: 'SERVICES',    color: '#34d399' },
  { label: 'COMMUNITIES', color: '#fbbf24' },
  { label: 'EVENTS',      color: '#60a5fa' },
]

// ─── Platform section cards ───────────────────────────────────────────────────

const SECTIONS = [
  {
    name: 'Marketplace',
    href: '/marketplace',
    active: true,
    description: 'Buy & sell anything',
    cardBg: '',
    iconBg: '',
    iconColor: '',
    nameColor: '',
    soonBg: '',
    soonColor: '',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    name: 'Services',
    href: '/services',
    active: false,
    description: 'Student freelancers',
    cardBg: 'bg-emerald-950/70 border border-emerald-400/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    nameColor: 'text-emerald-200',
    soonBg: 'bg-emerald-400/15',
    soonColor: 'text-emerald-300',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
  {
    name: 'Communities',
    href: '/communities',
    active: false,
    description: 'Join campus groups',
    cardBg: 'bg-amber-950/60 border border-amber-400/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    nameColor: 'text-amber-200',
    soonBg: 'bg-amber-400/15',
    soonColor: 'text-amber-300',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    name: 'Events',
    href: '/events',
    active: false,
    description: "What's happening",
    cardBg: 'bg-sky-950/70 border border-sky-400/20',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    nameColor: 'text-sky-200',
    soonBg: 'bg-sky-400/15',
    soonColor: 'text-sky-300',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
]

// ─── Shared cards grid (used in both mobile inline + desktop right col) ───────

function PlatformCards({ compact = false }: { compact?: boolean }) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll<HTMLElement>('.platform-card')
    animate(cards, {
      translateY: [36, 0],
      scale: [0.88, 1],
      opacity: [0, 1],
      delay: stagger(70, { start: 300 }),
      ease: spring({ stiffness: 280, damping: 18, mass: 0.9 }),
      duration: 800,
    })
  }, [])

  return (
    <div ref={gridRef} className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-3'} w-full`}>
      {SECTIONS.map((section, i) =>
        section.active ? (
          <Link
            key={section.name}
            href={section.href}
            className={`platform-card relative overflow-hidden bg-white rounded-2xl ${compact ? 'p-3' : 'p-4 sm:p-5'} flex flex-col ${compact ? 'gap-2' : 'gap-3'} active:scale-95 transition-all duration-150 shadow-xl shadow-black/20 cursor-pointer group focus:outline-none focus:ring-4 focus:ring-white/30`}
            style={{ opacity: 0 }}
          >
            {/* Shine sweep */}
            <div className="animate-card-shine absolute inset-y-0 w-16 bg-white/30 pointer-events-none" />

            <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-ume-indigo flex items-center justify-center text-white group-hover:bg-ume-pink transition-colors duration-200 relative z-10`}>
              <div className={compact ? 'w-4 h-4' : 'w-5 h-5'}>{section.icon}</div>
            </div>
            <div className="relative z-10">
              <p className={`font-bold text-ume-indigo ${compact ? 'text-xs' : 'text-sm'}`}>{section.name}</p>
              {!compact && <p className="text-gray-400 text-xs mt-0.5">{section.description}</p>}
            </div>
            <div className="flex items-center gap-1.5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-emerald-500 font-semibold`}>Live now</span>
            </div>
          </Link>
        ) : (
          <div
            key={section.name}
            className={`platform-card ${section.cardBg} rounded-2xl ${compact ? 'p-3' : 'p-4 sm:p-5'} flex flex-col ${compact ? 'gap-2' : 'gap-3'} select-none`}
            style={{ opacity: 0 }}
          >
            <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl ${section.iconBg} flex items-center justify-center ${section.iconColor}`}>
              <div className={compact ? 'w-4 h-4' : 'w-5 h-5'}>{section.icon}</div>
            </div>
            <div>
              <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${section.nameColor}`}>{section.name}</p>
              <span className={`inline-block text-[10px] ${section.soonBg} ${section.soonColor} font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1`}>
                Soon
              </span>
            </div>
          </div>
        )
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    const id = setInterval(() => {
      setPhase('out')
      setTimeout(() => {
        setWordIdx(i => (i + 1) % WORDS.length)
        setPhase('in')
      }, 320)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  const currentWord = WORDS[wordIdx]

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #130170 0%, #1a0190 40%, #0d0050 100%)' }}
    >
      {/* ── Animated background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 -left-10 w-96 h-96 rounded-full bg-ume-pink/20 blur-3xl animate-blob-1" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-ume-pink/10 blur-2xl animate-blob-3" />
        <div className="absolute top-[5%] right-[5%] w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl animate-blob-2" />
        <div className="absolute top-[45%] right-[15%] w-56 h-56 rounded-full bg-amber-500/12 blur-3xl animate-blob-1" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[5%] right-[0%] w-64 h-64 rounded-full bg-sky-500/15 blur-3xl animate-blob-3" style={{ animationDelay: '1.5s' }} />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on md+)
          Single column: badge → headline → cards → subtitle → CTAs
          Everything fits in one viewport — no boring blank text wall.
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 flex flex-col px-6 pt-10 pb-10">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-5 w-fit animate-hero-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-ume-pink opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ume-pink" />
          </span>
          <span className="text-white/80 text-xs font-medium tracking-wide">The all-in-one campus platform</span>
        </div>

        {/* Headline */}
        <h1 className="mb-5">
          <span className="block text-white font-black text-[clamp(2.6rem,13vw,3.5rem)] uppercase tracking-tight leading-[0.92] animate-hero-1">
            YOUR
          </span>
          <span className="block text-white font-black text-[clamp(2.6rem,13vw,3.5rem)] uppercase tracking-tight leading-[0.92] animate-hero-2">
            CAMPUS
          </span>
          <span
            className="block font-black text-[clamp(2.6rem,13vw,3.5rem)] uppercase tracking-tight leading-[0.92] animate-hero-3"
            style={{
              color: currentWord.color,
              opacity: phase === 'out' ? 0 : 1,
              transform: phase === 'out' ? 'translateY(-14px)' : 'translateY(0)',
              transition: 'opacity 0.28s ease, transform 0.28s ease, color 0.28s ease',
            }}
          >
            {currentWord.label}
          </span>
        </h1>

        {/* Platform cards — 2×2 compact grid, IN the first viewport */}
        <div className="mb-5 animate-hero-4">
          <PlatformCards compact />
        </div>

        {/* Subtitle */}
        <p className="text-white/60 text-sm mb-6 leading-relaxed animate-hero-4">
          Buy &amp; sell items, discover student services, join communities, and find events — built exclusively for students.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 animate-hero-5">
          <Link
            href="/marketplace"
            className="inline-block text-center px-7 py-3.5 bg-ume-pink text-white font-bold text-sm rounded-full hover:bg-pink-400 active:scale-95 transition-all duration-150 shadow-pink focus:outline-none focus:ring-4 focus:ring-ume-pink/40"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/signup"
            className="inline-block text-center px-7 py-3 border border-white/25 text-white font-semibold text-sm rounded-full hover:bg-white/10 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            Sign Up Free →
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden below md)
          Two columns: text left, large cards right. Full-height hero.
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-[calc(100vh-64px)] items-center relative z-10">

        {/* Left — headline + CTAs */}
        <div className="w-[52%] flex flex-col justify-center px-12 lg:px-16 py-16">

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-6 w-fit animate-hero-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-ume-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ume-pink" />
            </span>
            <span className="text-white/80 text-xs font-medium tracking-wide">The all-in-one campus platform</span>
          </div>

          <h1 className="mb-5">
            <span className="block text-white font-black text-[clamp(2.8rem,6vw,5rem)] uppercase tracking-tight leading-[0.92] animate-hero-1">
              YOUR
            </span>
            <span className="block text-white font-black text-[clamp(2.8rem,6vw,5rem)] uppercase tracking-tight leading-[0.92] animate-hero-2">
              CAMPUS
            </span>
            <span
              className="block font-black text-[clamp(2.8rem,6vw,5rem)] uppercase tracking-tight leading-[0.92] animate-hero-3"
              style={{
                color: currentWord.color,
                opacity: phase === 'out' ? 0 : 1,
                transform: phase === 'out' ? 'translateY(-14px)' : 'translateY(0)',
                transition: 'opacity 0.28s ease, transform 0.28s ease, color 0.28s ease',
              }}
            >
              {currentWord.label}
            </span>
          </h1>

          <p className="text-white/60 text-base lg:text-lg mb-8 max-w-sm leading-relaxed animate-hero-4">
            Buy &amp; sell items, discover student services, join communities, and find events — built exclusively for students.
          </p>

          <div className="flex flex-wrap gap-3 animate-hero-5">
            <Link
              href="/marketplace"
              className="inline-block px-7 py-3.5 bg-ume-pink text-white font-bold text-sm rounded-full hover:bg-pink-400 active:scale-95 transition-all duration-150 shadow-pink focus:outline-none focus:ring-4 focus:ring-ume-pink/40"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/signup"
              className="inline-block px-7 py-3.5 border border-white/25 text-white font-semibold text-sm rounded-full hover:bg-white/10 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Sign Up Free →
            </Link>
          </div>
        </div>

        {/* Right — large cards grid */}
        <div className="w-[48%] flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-[340px]">
            <PlatformCards compact={false} />
          </div>
        </div>
      </div>

      {/* ── Scroll hint (mobile only) ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 md:hidden animate-bounce-slow" aria-hidden="true">
        <div className="flex flex-col items-center gap-1">
          <span className="text-white/25 text-[9px] uppercase tracking-[0.2em]">scroll</span>
          <svg className="w-4 h-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  )
}
