import Link from 'next/link'

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Hero Section */}
      <div className="bg-[#f5f5f5]">
        <div className="px-12 pt-32 pb-40 min-h-[calc(100vh-88px)] flex flex-col items-center justify-center">
          <div className="text-center max-w-5xl">
            <p className="text-[13px] font-normal tracking-[0.05em] text-black mb-16">For students, by students</p>

            <h1 className="text-[100px] leading-[0.85] font-black tracking-[-0.03em] text-black mb-20" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              YOUR UNIVERSITY<br />MARKETPLACE
            </h1>

            <Link
              href="/marketplace"
              className="inline-block bg-black text-white px-20 py-5 text-[14px] font-medium tracking-[0.02em] hover:bg-gray-900 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Cart Icon */}
      <Link
        href="/marketplace"
        className="fixed bottom-10 right-10 bg-black text-white w-16 h-16 flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg"
        aria-label="View cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </Link>
    </div>
  )
}
