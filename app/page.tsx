import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left - Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-black">RECLAIM</h1>
                <span className="text-sm font-normal tracking-wide text-black">MARKETPLACE</span>
              </Link>
            </div>

            {/* Right - Icons */}
            <div className="flex items-center gap-6">
              <Link href="/marketplace" className="text-black hover:text-gray-600 transition-colors" aria-label="Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              {user && (
                <Link href="/create" className="text-black hover:text-gray-600 transition-colors" aria-label="Create listing">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              )}
              {user && (
                <Link href="/messages" className="text-black hover:text-gray-600 transition-colors" aria-label="Messages">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
              )}
              <Link href={user ? `/profile/${user.id}` : "/login"} className="text-black hover:text-gray-600 transition-colors" aria-label="Profile">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <Link href="/marketplace" className="text-black hover:text-gray-600 transition-colors" aria-label="Cart">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-8 py-32 min-h-[calc(100vh-100px)] flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-sm tracking-widest text-black mb-12">For students, by students</p>

            <h1 className="text-[5rem] md:text-[7rem] lg:text-[8.5rem] font-black leading-[0.9] tracking-tight text-black mb-16">
              YOUR UNIVERSITY<br />MARKETPLACE
            </h1>

            <Link
              href="/marketplace"
              className="inline-block bg-black text-white px-16 py-5 text-base font-medium tracking-wide hover:bg-gray-800 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Cart Icon */}
      <Link
        href="/marketplace"
        className="fixed bottom-8 right-8 bg-black text-white p-4 hover:bg-gray-800 transition-colors z-50"
        aria-label="View cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </Link>
    </div>
  )
}
