'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'

/**
 * MobileFilters Component
 *
 * Mobile-only filter drawer for marketplace filtering.
 * Features:
 * - Sort dropdown
 * - Condition dropdown
 * - Price range inputs
 * - Apply and Clear buttons
 * - Slides in from bottom
 */

interface MobileFiltersProps {
  isOpen: boolean
  onClose: () => void
  currentCondition?: string
  currentSort?: string
  currentMinPrice?: string
  currentMaxPrice?: string
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export default function MobileFilters({
  isOpen,
  onClose,
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice
}: MobileFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState(currentSort || 'relevance')
  const [condition, setCondition] = useState(currentCondition || 'all')
  const [minPrice, setMinPrice] = useState(currentMinPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || '')

  // Update local state when props change
  useEffect(() => {
    setSort(currentSort || 'relevance')
    setCondition(currentCondition || 'all')
    setMinPrice(currentMinPrice || '')
    setMaxPrice(currentMaxPrice || '')
  }, [currentSort, currentCondition, currentMinPrice, currentMaxPrice])

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Sort
    if (sort === 'relevance') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }

    // Condition
    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    // Price
    if (minPrice) {
      params.set('minPrice', (parseFloat(minPrice) * 100).toString())
    } else {
      params.delete('minPrice')
    }

    if (maxPrice) {
      params.set('maxPrice', (parseFloat(maxPrice) * 100).toString())
    } else {
      params.delete('maxPrice')
    }

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  const handleClearFilters = () => {
    setSort('relevance')
    setCondition('all')
    setMinPrice('')
    setMaxPrice('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('sort')
    params.delete('condition')
    params.delete('minPrice')
    params.delete('maxPrice')

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All Conditions</option>
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Price Range
            </label>
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  min="0"
                  step="1"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}
