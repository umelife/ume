'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import LocationRadiusSlider from '@/components/marketplace/LocationRadiusSlider'

interface MobileFiltersProps {
  isOpen: boolean
  onClose: () => void
  currentCondition?: string
  currentSort?: string
  currentMinPrice?: string
  currentMaxPrice?: string
  currentCampus?: string
  campusOptions?: { value: string; label: string }[]
  currentRadius?: number
  userLat?: number
  userLng?: number
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]
const PRICE_OPTIONS = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 to $50', min: 25, max: 50 },
  { label: '$50 to $100', min: 50, max: 100 },
  { label: '$100 to $200', min: 100, max: 200 },
  { label: '$200 & above', min: 200, max: null },
]

export default function MobileFilters({
  isOpen,
  onClose,
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentCampus,
  campusOptions = [],
  currentRadius,
  userLat,
  userLng,
}: MobileFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState(currentSort || 'relevance')
  const [condition, setCondition] = useState(currentCondition || 'all')
  const [campus, setCampus] = useState(currentCampus || '')
  const [selectedPriceOption, setSelectedPriceOption] = useState<string>('')

  const getCurrentPriceOption = () => {
    if (!currentMinPrice && !currentMaxPrice) return ''
    const min = currentMinPrice ? parseFloat(currentMinPrice) : 0
    const max = currentMaxPrice ? parseFloat(currentMaxPrice) : null
    for (const option of PRICE_OPTIONS) {
      if (option.min === min && option.max === max) return option.label
    }
    return ''
  }

  useEffect(() => {
    setSort(currentSort || 'relevance')
    setCondition(currentCondition || 'all')
    setCampus(currentCampus || '')
    setSelectedPriceOption(getCurrentPriceOption())
  }, [currentSort, currentCondition, currentMinPrice, currentMaxPrice, currentCampus])

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (sort === 'relevance') params.delete('sort')
    else params.set('sort', sort)

    if (condition === 'all') params.delete('condition')
    else params.set('condition', condition)

    if (campus) params.set('campus', campus)
    else params.delete('campus')

    if (selectedPriceOption) {
      const option = PRICE_OPTIONS.find(o => o.label === selectedPriceOption)
      if (option) {
        params.set('minPrice', (option.min * 100).toString())
        if (option.max !== null) params.set('maxPrice', (option.max * 100).toString())
        else params.delete('maxPrice')
      }
    } else {
      params.delete('minPrice')
      params.delete('maxPrice')
    }

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  const handleClearFilters = () => {
    setSort('relevance')
    setCondition('all')
    setCampus('')
    setSelectedPriceOption('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('sort')
    params.delete('condition')
    params.delete('campus')
    params.delete('minPrice')
    params.delete('maxPrice')

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} aria-hidden="true" />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Filters</h2>
          <button onClick={onClose} className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors" aria-label="Close filters">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Sort By</label>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="all">All Conditions</option>
              {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Price</label>
            <select value={selectedPriceOption} onChange={e => setSelectedPriceOption(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="">All Prices</option>
              {PRICE_OPTIONS.map(option => <option key={option.label} value={option.label}>{option.label}</option>)}
            </select>
          </div>

          {/* Campus */}
          {campusOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">Campus</label>
              <SearchableSelect
                options={campusOptions}
                value={campus}
                onChange={setCampus}
                placeholder="All Campuses"
                searchPlaceholder="Search campus..."
                fullWidth
              />
            </div>
          )}

          {/* Distance */}
          <div>
            <LocationRadiusSlider
              initialRadius={currentRadius ?? 25}
              userLat={userLat}
              userLng={userLng}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
          <button onClick={handleClearFilters}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors min-h-[52px]">
            Clear All
          </button>
          <button onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors min-h-[52px]">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}
