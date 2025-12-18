'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LocationRadiusSlider from './LocationRadiusSlider'

/**
 * FiltersRow Component
 *
 * Contains all filter controls:
 * - Condition dropdown
 * - Location Radius Slider
 * - Price Range button (placeholder for future)
 */

interface FiltersRowProps {
  currentCondition?: string
  currentRadius?: number
  userLat?: number
  userLng?: number
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']

export default function FiltersRow({
  currentCondition,
  currentRadius,
  userLat,
  userLng
}: FiltersRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleConditionChange = (condition: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handlePriceRange = () => {
    // Placeholder for future price range modal/dialog
    alert('Price range filter coming soon!')
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Condition Dropdown */}
        <div>
          <select
            value={currentCondition || 'all'}
            onChange={(e) => handleConditionChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 cursor-pointer"
            aria-label="Filter by condition"
          >
            <option value="all">Condition</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Dropdown */}
        <div>
          <select
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 cursor-pointer"
            aria-label="Filter by price"
          >
            <option>Price</option>
            <option>Under $25</option>
            <option>$25 - $50</option>
            <option>$50 - $100</option>
            <option>$100 - $200</option>
            <option>Over $200</option>
          </select>
        </div>
      </div>
    </div>
  )
}
