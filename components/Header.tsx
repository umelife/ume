'use client'

import Link from 'next/link'
import { useState } from 'react'
import HeaderInlineSearch from './search/HeaderInlineSearch'
import UnreadCountBadge from './UnreadCountBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface HeaderProps {
  unreadMessages?: number
  cartItemCount?: number
  userAvatar?: string
  userId?: string
}

export default function Header({ unreadMessages = 0, cartItemCount = 0, userAvatar, userId }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="px-6 md:px-12 h-16 flex items-center justify-between gap-6">

        {/* Left — Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-baseline hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            <span className="text-[36px] font-black tracking-[-0.03em] text-ume-indigo">U</span>
            <span className="text-[36px] font-black tracking-[-0.03em] text-ume-pink">M</span>
            <span className="text-[36px] font-black tracking-[-0.03em] text-ume-pink">E</span>
          </Link>
          <span
            className="text-[10px] font-semibold tracking-widest uppercase text-ume-indigo/60 leading-tight hidden lg:block"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            University<br />Market Exchange
          </span>
        </div>

        {/* Centre — Inline search (expands when open) */}
        {searchOpen ? (
          <div className="flex-1 max-w-2xl mx-4">
            <HeaderInlineSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        ) : (
          /* Centre — Nav links */
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="text-ume-indigo/80 hover:text-ume-indigo hover:bg-ume-indigo/5 font-medium">
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-ume-indigo/80 hover:text-ume-indigo hover:bg-ume-indigo/5 font-medium">
              <Link href="/services">Services</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-ume-indigo/80 hover:text-ume-indigo hover:bg-ume-indigo/5 font-medium">
              <Link href="/communities">Communities</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-ume-indigo/80 hover:text-ume-indigo hover:bg-ume-indigo/5 font-medium">
              <Link href="/events">Events</Link>
            </Button>
          </nav>
        )}

        {/* Right — Icon actions + auth */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 shrink-0">

            {/* Search */}
            {!searchOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    className="text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Search</TooltipContent>
              </Tooltip>
            )}

            {/* Liked / Cart */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5 relative"
                >
                  <Link href="/cart" aria-label="Liked">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-ume-pink text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Liked</TooltipContent>
            </Tooltip>

            {/* Messages — authenticated only */}
            {userId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5 relative"
                  >
                    <Link href="/messages" aria-label="Messages">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7" />
                      </svg>
                      <UnreadCountBadge userId={userId} initialCount={unreadMessages} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Messages</TooltipContent>
              </Tooltip>
            )}

            {/* Orders — authenticated only */}
            {userId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5"
                  >
                    <Link href="/orders" aria-label="Orders">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Orders</TooltipContent>
              </Tooltip>
            )}

            <Separator orientation="vertical" className="h-5 mx-1 bg-gray-200" />

            {/* Create listing — authenticated */}
            {userId && (
              <Button
                size="sm"
                asChild
                className="bg-ume-pink hover:bg-ume-pink/90 text-white font-semibold rounded-full px-4 shadow-sm"
              >
                <Link href="/create">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  List item
                </Link>
              </Button>
            )}

            {/* Profile / Login */}
            {userId ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5"
                  >
                    <Link href={`/profile/${userId}`} aria-label="Profile">
                      {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-7 h-7 rounded-full object-cover ring-2 ring-ume-indigo/20" />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-ume-indigo/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="5" />
                            <path d="M20 21a8 8 0 1 0-16 0" />
                          </svg>
                        </span>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Profile</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-ume-indigo font-medium hover:bg-ume-indigo/5">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild className="bg-ume-indigo hover:bg-ume-indigo/90 text-white font-semibold rounded-full px-4">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
