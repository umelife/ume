'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeaderInlineSearch from './search/HeaderInlineSearch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet'

interface MobileHeaderProps {
  unreadMessages?: number
  cartItemCount?: number
  userAvatar?: string
  userId?: string
}

export default function MobileHeader({
  unreadMessages = 0,
  cartItemCount = 0,
  userAvatar,
  userId,
}: MobileHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      {/* Mobile compact header — hidden on md+ */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-3 h-12 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-baseline shrink-0"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            <span className="text-[26px] font-black tracking-[-0.03em] text-ume-indigo">U</span>
            <span className="text-[26px] font-black tracking-[-0.03em] text-ume-pink">M</span>
            <span className="text-[26px] font-black tracking-[-0.03em] text-ume-pink">E</span>
          </Link>

          {/* Right icon cluster */}
          <div className="flex items-center gap-0.5">

            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="h-11 w-11 text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5"
            >
              <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Button>

            {/* Liked / Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/cart')}
              aria-label="Liked"
              className="h-9 w-9 text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5 relative"
            >
              <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-ume-pink text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>

            {/* Hamburger — opens Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="h-11 w-11 text-ume-indigo/70 hover:text-ume-indigo hover:bg-ume-indigo/5"
                >
                  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-64 p-0 bg-white">
                {/* Sheet header */}
                <SheetHeader className="px-5 py-4 border-b border-gray-100">
                  <SheetTitle asChild>
                    <Link
                      href="/"
                      className="flex items-baseline w-fit"
                      style={{ fontFamily: "'Archivo Black', sans-serif" }}
                    >
                      <span className="text-[24px] font-black tracking-[-0.03em] text-ume-indigo">U</span>
                      <span className="text-[24px] font-black tracking-[-0.03em] text-ume-pink">M</span>
                      <span className="text-[24px] font-black tracking-[-0.03em] text-ume-pink">E</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {/* Nav links */}
                <nav className="px-3 py-3 flex flex-col gap-0.5">
                  <SheetClose asChild>
                    <Link
                      href="/marketplace"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ume-indigo hover:bg-ume-indigo/5 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0 text-ume-indigo/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="M9 22V12h6v10" />
                      </svg>
                      Marketplace
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/communities"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ume-indigo hover:bg-ume-indigo/5 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0 text-ume-indigo/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      Communities
                    </Link>
                  </SheetClose>

                  {/* Authenticated links */}
                  {userId && (
                    <>
                      <Separator className="my-2" />

                      <SheetClose asChild>
                        <Link
                          href="/messages"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ume-indigo hover:bg-ume-indigo/5 transition-colors"
                        >
                          <svg className="w-4 h-4 shrink-0 text-ume-indigo/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7" />
                          </svg>
                          Messages
                          {unreadMessages > 0 && (
                            <Badge className="ml-auto bg-ume-pink hover:bg-ume-pink text-white text-[10px] font-bold px-1.5 min-w-0 h-5">
                              {unreadMessages > 99 ? '99+' : unreadMessages}
                            </Badge>
                          )}
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link
                          href="/orders"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ume-indigo hover:bg-ume-indigo/5 transition-colors"
                        >
                          <svg className="w-4 h-4 shrink-0 text-ume-indigo/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Orders
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link
                          href={`/profile/${userId}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ume-indigo hover:bg-ume-indigo/5 transition-colors"
                        >
                          {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="w-4 h-4 rounded-full object-cover shrink-0" />
                          ) : (
                            <svg className="w-4 h-4 shrink-0 text-ume-indigo/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <circle cx="12" cy="8" r="5" />
                              <path d="M20 21a8 8 0 1 0-16 0" />
                            </svg>
                          )}
                          Profile
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </nav>

                {/* Bottom CTA */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                  {userId ? (
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="w-full bg-ume-pink hover:bg-ume-pink/90 text-white font-semibold rounded-full"
                      >
                        <Link href="/create">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          List an item
                        </Link>
                      </Button>
                    </SheetClose>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button asChild className="w-full bg-ume-indigo hover:bg-ume-indigo/90 text-white font-semibold rounded-full">
                          <Link href="/signup">Sign up free</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild variant="ghost" className="w-full text-ume-indigo font-medium hover:bg-ume-indigo/5 rounded-full">
                          <Link href="/login">Log in</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Inline search row */}
        {searchOpen && (
          <div className="px-3 pb-2.5">
            <HeaderInlineSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        )}
      </header>
    </>
  )
}
