'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { animate, spring } from 'animejs'
import { Badge } from '@/components/ui/badge'

interface Tab {
  label: string
  href: string
  comingSoon?: boolean
  icon: (active: boolean) => React.ReactNode
}

const tabs: Tab[] = [
  {
    label: 'Home',
    href: '/',
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'Marketplace',
    href: '/marketplace',
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
  {
    label: 'Create',
    href: '/create',
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
]

interface MobileTabBarProps {
  unreadMessages?: number
  userId?: string
}

export default function MobileTabBar({ unreadMessages = 0, userId }: MobileTabBarProps) {
  const pathname = usePathname()
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])

  if (pathname.startsWith('/safe-handshake')) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/profile') return pathname.startsWith('/profile')
    return pathname.startsWith(href)
  }

  const activeIndex = tabs.findIndex(tab => isActive(tab.href))

  // Spring-animate the sliding pill to the active tab position
  useEffect(() => {
    const pill = pillRef.current
    const activeEl = tabRefs.current[activeIndex]
    if (!pill || !activeEl) return

    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = activeEl
    animate(pill, {
      left: offsetLeft,
      top: offsetTop,
      width: offsetWidth,
      height: offsetHeight,
      ease: spring({ stiffness: 380, damping: 22, mass: 0.8 }),
      duration: 600,
    })
  }, [activeIndex])

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-auto">
      {/* Mobile: icons-only compact pill with spring sliding indicator */}
      <div className="relative flex sm:hidden items-center gap-0.5 bg-white shadow-2xl border border-gray-100/80 rounded-full px-1.5 py-1.5">
        {/* Sliding active pill */}
        <span
          ref={pillRef}
          className="absolute rounded-full bg-ume-indigo shadow-lg shadow-ume-indigo/20 pointer-events-none"
          aria-hidden="true"
        />
        {tabs.map((tab, i) => {
          const active = isActive(tab.href)
          const showUnread = tab.href === '/messages' && unreadMessages > 0

          const href = tab.href === '/profile'
            ? (userId ? `/profile/${userId}` : '/login')
            : tab.href

          return (
            <Link
              key={tab.href}
              href={href}
              ref={el => { tabRefs.current[i] = el }}
              aria-label={tab.label}
              className="relative flex items-center justify-center w-12 h-12 rounded-full z-10"
            >
              {tab.icon(active)}

              {/* Unread badge */}
              {showUnread && (
                <span className="absolute top-1.5 right-1.5 bg-ume-pink text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none border border-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}

              {/* Coming soon dot */}
              {tab.comingSoon && !active && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-ume-pink rounded-full border border-white" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Desktop (sm+): icons + labels pill */}
      <div className="hidden sm:flex items-center gap-0.5 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-full px-2 py-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const showUnread = tab.href === '/messages' && unreadMessages > 0
          const desktopHref = tab.href === '/profile'
            ? (userId ? `/profile/${userId}` : '/login')
            : tab.href

          return (
            <Link
              key={tab.href}
              href={desktopHref}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                ${active
                  ? 'bg-ume-indigo text-white shadow-md shadow-ume-indigo/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              {tab.icon(active)}
              <span>{tab.label}</span>

              {/* Unread badge */}
              {showUnread && (
                <Badge className="absolute -top-1.5 -right-1 bg-ume-pink hover:bg-ume-pink text-white text-[9px] font-bold px-1 min-w-0 h-4 border border-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}

              {/* Coming soon label */}
              {tab.comingSoon && (
                <span className="absolute -top-1.5 -right-1 text-[8px] bg-ume-pink text-white px-1 py-px rounded-full font-bold leading-tight">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
