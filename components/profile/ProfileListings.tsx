'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProductGrid from '@/components/marketplace/ProductGrid'
import type { Listing } from '@/types/database'

interface ProfileListingsProps {
  listings: Listing[]
  isOwnProfile: boolean
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'oldest',     label: 'Oldest' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]
const PRICE_OPTIONS = [
  { label: 'Under $25',    min: 0,   max: 25   },
  { label: '$25 to $50',   min: 25,  max: 50   },
  { label: '$50 to $100',  min: 50,  max: 100  },
  { label: '$100 to $200', min: 100, max: 200  },
  { label: '$200 & above', min: 200, max: null },
]

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function ProfileListings({ listings, isOwnProfile }: ProfileListingsProps) {
  // ── Applied filter state ──────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sort, setSort]             = useState('newest')
  const [condition, setCondition]   = useState<string | null>(null)
  const [priceMin, setPriceMin]     = useState<number | null>(null)
  const [priceMax, setPriceMax]     = useState<number | null>(null)
  const [priceLabel, setPriceLabel] = useState<string | null>(null)

  // ── Desktop dropdown open state ───────────────────────────────────────────
  const [sortOpen, setSortOpen]           = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [priceOpen, setPriceOpen]         = useState(false)

  // ── Mobile drawer state ───────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]           = useState(false)
  const [draftSort, setDraftSort]             = useState('newest')
  const [draftCondition, setDraftCondition]   = useState<string>('all')
  const [draftPriceLabel, setDraftPriceLabel] = useState<string>('')

  // When the drawer opens, copy applied values into drafts
  useEffect(() => {
    if (drawerOpen) {
      setDraftSort(sort)
      setDraftCondition(condition || 'all')
      setDraftPriceLabel(priceLabel || '')
    }
  }, [drawerOpen])

  const openDrawer  = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)
  const closeDesktopDropdowns = () => { setSortOpen(false); setConditionOpen(false); setPriceOpen(false) }

  const applyDrawer = () => {
    setSort(draftSort)
    setCondition(draftCondition === 'all' ? null : draftCondition)
    const opt = PRICE_OPTIONS.find(o => o.label === draftPriceLabel) || null
    setPriceMin(opt ? opt.min : null)
    setPriceMax(opt ? opt.max : null)
    setPriceLabel(opt ? opt.label : null)
    closeDrawer()
  }

  const clearDrawer = () => {
    setDraftSort('newest')
    setDraftCondition('all')
    setDraftPriceLabel('')
    setSort('newest')
    setCondition(null)
    setPriceMin(null)
    setPriceMax(null)
    setPriceLabel(null)
    closeDrawer()
  }

  // Count active non-category filters for badge on Filters button
  const activeFilterCount = [condition, priceLabel].filter(Boolean).length + (sort !== 'newest' ? 1 : 0)

  // Categories present in this user's listings
  const categories = useMemo(
    () => [...new Set(listings.map(l => l.category).filter(Boolean))].sort() as string[],
    [listings]
  )

  const filtered = useMemo(() => {
    let result = [...listings]
    if (selectedCategory) result = result.filter(l => l.category === selectedCategory)
    if (condition)         result = result.filter(l => l.condition === condition)
    if (priceMin !== null) result = result.filter(l => l.price >= priceMin * 100)
    if (priceMax !== null) result = result.filter(l => l.price <= priceMax * 100)
    switch (sort) {
      case 'price-asc':  result.sort((a, b) => a.price - b.price); break
      case 'price-desc': result.sort((a, b) => b.price - a.price); break
      case 'oldest':     result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      default:           result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return result
  }, [listings, selectedCategory, condition, priceMin, priceMax, sort])

  // ── Empty state (no listings at all) ────────────────────────────────────
  if (listings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-400 text-lg font-medium">No listings yet</p>
        {isOwnProfile && (
          <Link href="/create" className="inline-block mt-4 px-6 py-2 bg-ume-indigo text-white rounded-full text-sm font-medium hover:bg-indigo-800 transition-colors">
            Post your first listing
          </Link>
        )}
      </div>
    )
  }

  return (
    <div onClick={closeDesktopDropdowns}>

      {/* ── Row 1: Category chips ─────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Mobile: horizontal scroll */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 [&::-webkit-scrollbar]:hidden" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <div className="flex gap-2 min-w-max">
            <button
              onClick={e => { e.stopPropagation(); setSelectedCategory(null) }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2 ${
                !selectedCategory ? 'bg-ume-indigo text-white shadow-md' : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
              }`}
            >All</button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={e => { e.stopPropagation(); setSelectedCategory(selectedCategory === cat ? null : cat) }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2 ${
                  selectedCategory === cat ? 'bg-ume-indigo text-white shadow-md' : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Desktop: centred wrap */}
        <div className="hidden md:flex items-center justify-center gap-3 flex-wrap px-4">
          <button
            onClick={e => { e.stopPropagation(); setSelectedCategory(null) }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2 ${
              !selectedCategory ? 'bg-ume-indigo text-white shadow-md' : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
            }`}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={e => { e.stopPropagation(); setSelectedCategory(selectedCategory === cat ? null : cat) }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2 ${
                selectedCategory === cat ? 'bg-ume-indigo text-white shadow-md' : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* ── Row 2a: Mobile — "Filters" button ─────────────────────────────── */}
      <div className="md:hidden flex justify-end mb-4 px-4">
        <button
          onClick={e => { e.stopPropagation(); openDrawer() }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Open filters"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-ume-indigo text-white text-xs flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Row 2b: Desktop — Sort | Condition | Price text dropdowns ─────── */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-4 flex-wrap">

          {/* Sort */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setSortOpen(!sortOpen); setConditionOpen(false); setPriceOpen(false) }}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            >
              <span>{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
              <ChevronDown open={sortOpen} />
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sort === opt.value ? 'text-ume-indigo font-medium' : 'text-gray-900'}`}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>

          <span className="text-gray-300">|</span>

          {/* Condition */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setConditionOpen(!conditionOpen); setSortOpen(false); setPriceOpen(false) }}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            >
              <span>{condition || 'Condition'}</span>
              <ChevronDown open={conditionOpen} />
            </button>
            {conditionOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                <button onClick={() => { setCondition(null); setConditionOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!condition ? 'text-ume-indigo font-medium' : 'text-gray-900'}`}
                >All</button>
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => { setCondition(c); setConditionOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${condition === c ? 'text-ume-indigo font-medium' : 'text-gray-900'}`}
                  >{c}</button>
                ))}
              </div>
            )}
          </div>

          <span className="text-gray-300">|</span>

          {/* Price */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setPriceOpen(!priceOpen); setSortOpen(false); setConditionOpen(false) }}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            >
              <span>{priceLabel || 'Price'}</span>
              <ChevronDown open={priceOpen} />
            </button>
            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                {priceLabel && (
                  <button onClick={() => { setPriceMin(null); setPriceMax(null); setPriceLabel(null); setPriceOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                  >Clear filter</button>
                )}
                {PRICE_OPTIONS.map(opt => (
                  <button key={opt.label} onClick={() => { setPriceMin(opt.min); setPriceMax(opt.max); setPriceLabel(opt.label); setPriceOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${priceLabel === opt.label ? 'text-ume-indigo font-medium' : 'text-gray-900'}`}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Row 3: Listing count ─────────────────────────────────────────── */}
      <div className="mt-4 mb-3 text-sm text-black">
        {filtered.length === 0 ? 'No listings found' : `Showing ${filtered.length} listing${filtered.length === 1 ? '' : 's'}`}
      </div>

      {/* ── Row 4: Grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-16 w-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-black text-lg mt-4">No listings match your filters</p>
          <p className="text-black text-sm mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <ProductGrid listings={filtered} />
      )}

      {/* ── Mobile filter drawer (slides up from bottom) ─────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeDrawer} aria-hidden="true" />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">Filters</h2>
              <button onClick={closeDrawer} className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors" aria-label="Close filters">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-6">
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Sort By</label>
                <select
                  value={draftSort}
                  onChange={e => setDraftSort(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Condition</label>
                <select
                  value={draftCondition}
                  onChange={e => setDraftCondition(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="all">All Conditions</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Price</label>
                <select
                  value={draftPriceLabel}
                  onChange={e => setDraftPriceLabel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">All Prices</option>
                  {PRICE_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={clearDrawer} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors">
                Clear All
              </button>
              <button onClick={applyDrawer} className="flex-1 px-4 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
