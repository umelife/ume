'use client'

/**
 * MobileFilterButton Component
 *
 * Client component button that triggers the mobile filter drawer.
 * Positioned below the category bar on mobile, hidden on desktop.
 */

export default function MobileFilterButton() {
  const handleOpenFilters = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('openMobileFilters'))
    }
  }

  return (
    <div className="md:hidden flex justify-end mb-4 px-4">
      <button
        onClick={handleOpenFilters}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Open filters"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        Filters
      </button>
    </div>
  )
}
