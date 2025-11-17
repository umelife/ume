'use client'

/**
 * Enhanced Search Filter Component
 *
 * Advanced filtering and sorting UI for marketplace listings
 * Features:
 * - Multi-criteria filtering (condition, price, seller rating, features)
 * - Multiple sort options with icons
 * - Collapsible filter sections
 * - Active filter badges
 * - Clear all filters
 * - Mobile responsive
 */

import { useState, useEffect } from 'react'
import type { Listing, ListingCondition } from '@/types/database'
import type { FilterOptions, SortConfig, SortOption } from '@/lib/utils/listingFilters'
import { getUniqueFilterOptions, getActiveFilterCount } from '@/lib/utils/listingFilters'

const CATEGORIES = [
  'All',
  'Dorm and Decor',
  'Fun and Craft',
  'Transportation',
  'Tech and Gadgets',
  'Books',
  'Clothing and Accessories',
  'Giveaways'
]

const CONDITIONS: ListingCondition[] = ['New', 'Like New', 'Used', 'Refurbished', 'For Parts']

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'Newest First', icon: '🕒' },
  { value: 'price_low', label: 'Price: Low to High', icon: '💰' },
  { value: 'price_high', label: 'Price: High to Low', icon: '💎' },
  { value: 'condition', label: 'Best Condition', icon: '✨' },
  { value: 'seller_rating', label: 'Seller Rating', icon: '⭐' },
  { value: 'features', label: 'Most Features', icon: '🔧' }
]

interface EnhancedSearchFilterProps {
  allListings: Listing[]
  filters: FilterOptions
  sortConfig: SortConfig
  onFiltersChange: (filters: FilterOptions) => void
  onSortChange: (sortConfig: SortConfig) => void
}

export default function EnhancedSearchFilter({
  allListings,
  filters,
  sortConfig,
  onFiltersChange,
  onSortChange
}: EnhancedSearchFilterProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Get available filter options from listings
  const availableOptions = getUniqueFilterOptions(allListings)
  const activeFilterCount = getActiveFilterCount(filters)

  // Handle search input
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  // Handle category change
  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category })
  }

  // Handle condition toggle
  const handleConditionToggle = (condition: ListingCondition) => {
    const current = filters.conditions || []
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition]
    onFiltersChange({ ...filters, conditions: updated })
  }

  // Handle seller rating filter
  const handleSellerRatingChange = (rating: number | undefined) => {
    onFiltersChange({ ...filters, sellerRating: rating })
  }

  // Handle verified sellers toggle
  const handleVerifiedToggle = () => {
    onFiltersChange({
      ...filters,
      verifiedSellersOnly: !filters.verifiedSellersOnly
    })
  }

  // Handle array filter toggle (brands, features, etc.)
  const handleArrayFilterToggle = (
    key: 'brands' | 'colors' | 'sizes' | 'materials' | 'features',
    value: string
  ) => {
    const current = filters[key] || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFiltersChange({ ...filters, [key]: updated })
  }

  // Handle price range
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    if (type === 'min') {
      onFiltersChange({ ...filters, minPrice: numValue })
    } else {
      onFiltersChange({ ...filters, maxPrice: numValue })
    }
  }

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({})
  }

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    onSortChange({ option })
    setShowSortDropdown(false)
  }

  const currentSortOption = SORT_OPTIONS.find(opt => opt.value === sortConfig.option)

  return (
    <div className="space-y-4">
      {/* Show current search query if exists */}
      {filters.search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-blue-900 font-medium">Searching for: "{filters.search}"</span>
          </div>
          <button
            onClick={() => handleSearchChange('')}
            className="text-blue-700 hover:text-blue-900 font-medium text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Sort Dropdown */}
      <div className="flex gap-3">
        <div className="relative w-full sm:w-64">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between text-gray-900"
          >
            <span className="flex items-center gap-2">
              <span>{currentSortOption?.icon}</span>
              <span className="font-medium">{currentSortOption?.label || 'Sort by'}</span>
            </span>
            <svg className={`w-5 h-5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-64 overflow-y-auto">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 ${
                      sortConfig.option === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                    {sortConfig.option === option.value && (
                      <svg className="w-5 h-5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full transition-all ${
              (filters.category || 'All') === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Filters Badge & Clear All */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
          <button
            onClick={handleClearAll}
            className="ml-auto text-sm text-blue-700 hover:text-blue-900 font-medium underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Condition Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>✨</span> Condition
        </h3>
        <div className="flex gap-2 flex-wrap">
          {CONDITIONS.map((condition) => {
            const isSelected = filters.conditions?.includes(condition)
            return (
              <button
                key={condition}
                onClick={() => handleConditionToggle(condition)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {condition}
                {isSelected && (
                  <span className="ml-1.5">✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seller Rating Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>⭐</span> Seller Rating
        </h3>
        <div className="flex gap-2 flex-wrap">
          {[5, 4, 3].map((rating) => {
            const isSelected = filters.sellerRating === rating
            return (
              <button
                key={rating}
                onClick={() => handleSellerRatingChange(isSelected ? undefined : rating)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-yellow-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}★ & up
              </button>
            )
          })}

          <button
            onClick={handleVerifiedToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.verifiedSellersOnly
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1.5">{filters.verifiedSellersOnly ? '✓' : ''}</span>
            Verified Sellers Only
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>💰</span> Price Range
        </h3>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* More Filters (Collapsible) */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🔍</span> More Filters
          </span>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMoreFilters && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Brands */}
            {availableOptions.brands.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Brand</h4>
                <div className="flex gap-2 flex-wrap">
                  {availableOptions.brands.map((brand) => {
                    const isSelected = filters.brands?.includes(brand)
                    return (
                      <button
                        key={brand}
                        onClick={() => handleArrayFilterToggle('brands', brand)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {brand}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {availableOptions.colors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Color</h4>
                <div className="flex gap-2 flex-wrap">
                  {availableOptions.colors.map((color) => {
                    const isSelected = filters.colors?.includes(color)
                    return (
                      <button
                        key={color}
                        onClick={() => handleArrayFilterToggle('colors', color)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {color}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableOptions.sizes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Size</h4>
                <div className="flex gap-2 flex-wrap">
                  {availableOptions.sizes.map((size) => {
                    const isSelected = filters.sizes?.includes(size)
                    return (
                      <button
                        key={size}
                        onClick={() => handleArrayFilterToggle('sizes', size)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Materials */}
            {availableOptions.materials.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Material</h4>
                <div className="flex gap-2 flex-wrap">
                  {availableOptions.materials.map((material) => {
                    const isSelected = filters.materials?.includes(material)
                    return (
                      <button
                        key={material}
                        onClick={() => handleArrayFilterToggle('materials', material)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {material}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Features */}
            {availableOptions.features.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Features</h4>
                <div className="flex gap-2 flex-wrap">
                  {availableOptions.features.map((feature) => {
                    const isSelected = filters.features?.includes(feature)
                    return (
                      <button
                        key={feature}
                        onClick={() => handleArrayFilterToggle('features', feature)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {feature}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
