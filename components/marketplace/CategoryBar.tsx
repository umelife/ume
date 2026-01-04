'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import CategoryIcon from '@/components/marketplace/CategoryIcon'

/**
 * CategoryBar Component
 *
 * Displays horizontal category chips that users can click to filter listings.
 * Features:
 * - Categories stay in their original position
 * - Updates URL with ?category=slug
 * - Centered layout with equal spacing
 * - Keyboard accessible with focus rings
 * - Shows Phosphor icons for each category
 */

const CATEGORIES = [
  { slug: 'dorm-and-decor', display: 'Dorm & Decor' },
  { slug: 'fun-and-craft', display: 'Fun & Craft' },
  { slug: 'books', display: 'Books' },
  { slug: 'clothing-and-accessories', display: 'Clothing & Accessories' },
  { slug: 'transportation', display: 'Transportation' },
  { slug: 'tech-and-gadgets', display: 'Tech & Gadgets' },
  { slug: 'giveaways', display: 'Giveaways' },
  { slug: 'other', display: 'Other' },
]

interface CategoryBarProps {
  currentCategory?: string
}

export default function CategoryBar({ currentCategory }: CategoryBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())

    // Toggle category: if clicking active category, clear it
    if (currentCategory === slug) {
      params.delete('category')
    } else {
      params.set('category', slug)
    }

    // Navigate to new URL
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleViewAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      {/* Centered container with equal spacing */}
      <div className="flex items-center justify-center gap-3 flex-wrap px-4">
        {/* View All chip */}
        <button
          onClick={handleViewAll}
          className={`
            flex items-center gap-2 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${!currentCategory
              ? 'bg-black text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
          aria-pressed={!currentCategory}
          aria-label="View all categories"
        >
          <CategoryIcon category="All" size={20} />
          <span>All</span>
        </button>

        {/* Category chips - always in original order */}
        {CATEGORIES.map((category) => {
          const isActive = currentCategory === category.slug

          return (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`
                flex items-center gap-2 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Filter by ${category.display}`}
            >
              <CategoryIcon category={category.display} size={20} />
              <span>{category.display}</span>
            </button>
          )
        })}
      </div>

      {/* Hide scrollbar for cleaner look */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
