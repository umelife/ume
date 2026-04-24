'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import SearchableSelect from '@/components/ui/SearchableSelect'
import LocationRadiusSlider from '@/components/marketplace/LocationRadiusSlider'

interface FiltersRowProps {
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

/** Chevron icon used in filter trigger buttons */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/** Shared dropdown container */
function FilterDropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-md z-20 min-w-[168px] py-1.5 overflow-hidden">
      {children}
    </div>
  )
}

/** Single item inside a dropdown */
function DropdownItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        active
          ? 'bg-ume-indigo/5 text-ume-indigo font-semibold'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function FiltersRow({
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentCampus,
  campusOptions = [],
  currentRadius,
  userLat,
  userLng,
}: FiltersRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [priceOpen, setPriceOpen] = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const getCurrentPriceLabel = () => {
    if (!currentMinPrice && !currentMaxPrice) return 'Price'
    const min = currentMinPrice ? parseFloat(currentMinPrice) : 0
    const max = currentMaxPrice ? parseFloat(currentMaxPrice) : null
    for (const option of PRICE_OPTIONS) {
      if (option.min === min && option.max === max) return option.label
    }
    return 'Price'
  }

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleSortChange = (sort: string) => {
    updateParam('sort', sort === 'relevance' ? null : sort)
    setSortOpen(false)
  }

  const handleConditionChange = (condition: string) => {
    updateParam('condition', condition === 'all' ? null : condition)
    setConditionOpen(false)
  }

  const handlePriceSelect = (min: number, max: number | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('minPrice', (min * 100).toString())
    if (max !== null) params.set('maxPrice', (max * 100).toString())
    else params.delete('maxPrice')
    router.push(`/marketplace?${params.toString()}`)
    setPriceOpen(false)
  }

  const handleClearPrice = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    router.push(`/marketplace?${params.toString()}`)
    setPriceOpen(false)
  }

  const handleCampusChange = (campus: string) => {
    updateParam('campus', campus || null)
  }

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sort')
    params.delete('condition')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('campus')
    router.push(`/marketplace?${params.toString()}`)
    setSortOpen(false)
    setConditionOpen(false)
    setPriceOpen(false)
  }

  const closeAll = () => {
    setSortOpen(false)
    setConditionOpen(false)
    setPriceOpen(false)
  }

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === (currentSort || 'relevance'))?.label || 'Relevance'
  const priceLabel = getCurrentPriceLabel()
  const sortActive = !!currentSort && currentSort !== 'relevance'
  const priceActive = priceLabel !== 'Price'
  const conditionActive = !!currentCondition

  const activeCount = [sortActive, conditionActive, priceActive, !!currentCampus].filter(Boolean).length
  const hasActiveFilters = activeCount > 0

  return (
    <div className="hidden md:block mb-6">
      {/* ── Filter controls row ── */}
      <div className="flex items-center gap-1.5 flex-wrap">

        {/* Label */}
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1 select-none">
          Filter
        </span>

        <Separator orientation="vertical" className="h-4 bg-gray-200 mx-1" />

        {/* ── Sort ── */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSortOpen(!sortOpen); setConditionOpen(false); setPriceOpen(false) }}
            className={`h-8 rounded-full text-xs font-medium gap-1 px-3 border transition-all duration-150 ${
              sortActive
                ? 'border-ume-indigo bg-ume-indigo text-white hover:bg-ume-indigo/90 hover:text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-ume-indigo/40 hover:text-ume-indigo'
            }`}
          >
            {sortLabel}
            <Chevron open={sortOpen} />
          </Button>
          {sortOpen && (
            <FilterDropdown>
              {SORT_OPTIONS.map((option) => (
                <DropdownItem
                  key={option.value}
                  active={(currentSort || 'relevance') === option.value}
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </FilterDropdown>
          )}
        </div>

        {/* ── Condition ── */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setConditionOpen(!conditionOpen); setSortOpen(false); setPriceOpen(false) }}
            className={`h-8 rounded-full text-xs font-medium gap-1 px-3 border transition-all duration-150 ${
              conditionActive
                ? 'border-ume-indigo bg-ume-indigo text-white hover:bg-ume-indigo/90 hover:text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-ume-indigo/40 hover:text-ume-indigo'
            }`}
          >
            {currentCondition || 'Condition'}
            <Chevron open={conditionOpen} />
          </Button>
          {conditionOpen && (
            <FilterDropdown>
              <DropdownItem active={!currentCondition} onClick={() => handleConditionChange('all')}>
                All conditions
              </DropdownItem>
              <Separator className="my-1 bg-gray-100" />
              {CONDITIONS.map((condition) => (
                <DropdownItem
                  key={condition}
                  active={currentCondition === condition}
                  onClick={() => handleConditionChange(condition)}
                >
                  {condition}
                </DropdownItem>
              ))}
            </FilterDropdown>
          )}
        </div>

        {/* ── Price ── */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPriceOpen(!priceOpen); setSortOpen(false); setConditionOpen(false) }}
            className={`h-8 rounded-full text-xs font-medium gap-1 px-3 border transition-all duration-150 ${
              priceActive
                ? 'border-ume-indigo bg-ume-indigo text-white hover:bg-ume-indigo/90 hover:text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-ume-indigo/40 hover:text-ume-indigo'
            }`}
          >
            {priceLabel}
            <Chevron open={priceOpen} />
          </Button>
          {priceOpen && (
            <FilterDropdown>
              {(currentMinPrice || currentMaxPrice) && (
                <>
                  <button
                    onClick={handleClearPrice}
                    className="w-full text-left px-4 py-2 text-xs text-ume-pink font-semibold hover:bg-ume-pink/5 transition-colors"
                  >
                    Clear price filter
                  </button>
                  <Separator className="my-1 bg-gray-100" />
                </>
              )}
              {PRICE_OPTIONS.map((option) => (
                <DropdownItem
                  key={option.label}
                  active={priceLabel === option.label}
                  onClick={() => handlePriceSelect(option.min, option.max)}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </FilterDropdown>
          )}
        </div>

        {/* ── Campus ── */}
        {campusOptions.length > 0 && (
          <div className={`[&_button]:h-8 [&_button]:rounded-full [&_button]:text-xs [&_button]:font-medium [&_button]:px-3 [&_button]:border [&_button]:transition-all [&_button]:duration-150 ${
            currentCampus
              ? '[&_button]:border-ume-indigo [&_button]:bg-ume-indigo [&_button]:text-white [&_button]:shadow-sm'
              : '[&_button]:border-gray-200 [&_button]:bg-white [&_button]:text-gray-600'
          }`}>
            <SearchableSelect
              options={campusOptions}
              value={currentCampus || ''}
              onChange={(val) => { closeAll(); handleCampusChange(val) }}
              placeholder="Campus"
              searchPlaceholder="Search campus..."
            />
          </div>
        )}

        {/* ── Active filter count badge + Clear all ── */}
        {hasActiveFilters && (
          <>
            <Separator orientation="vertical" className="h-4 bg-gray-200 mx-1" />
            <Badge
              className="bg-ume-pink/15 text-ume-pink border-0 text-[10px] font-bold rounded-full px-2.5 py-0.5 select-none"
            >
              {activeCount} active
            </Badge>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-ume-indigo transition-colors underline-offset-2 hover:underline ml-0.5"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* ── Location radius slider — sits below the filter pills ── */}
      <div className="mt-3 w-64">
        <LocationRadiusSlider
          initialRadius={currentRadius ?? 25}
          userLat={userLat}
          userLng={userLng}
        />
      </div>
    </div>
  )
}
