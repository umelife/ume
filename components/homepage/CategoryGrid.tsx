/**
 * CategoryGrid Component
 *
 * Category grid with Phosphor icons and labels.
 * Matches screenshot 3: "CATEGORIES" heading with "ALL" button and icon grid below.
 * Features:
 * - 7 categories in a horizontal row (responsive wrapping)
 * - Phosphor icon + label for each category
 * - Links to marketplace with category filter
 * - Accessible keyboard navigation
 */

'use client'

import Link from 'next/link'
import CategoryIcon from '@/components/marketplace/CategoryIcon'

interface Category {
  id: string
  name: string
  categoryKey: string // Key for CategoryIcon component
  href: string
}

const categories: Category[] = [
  {
    id: 'dorm',
    name: 'Dorm & Decor',
    categoryKey: 'Dorm & Decor',
    href: '/marketplace?category=dorm-and-decor'
  },
  {
    id: 'craft',
    name: 'Fun & Craft',
    categoryKey: 'Fun & Craft',
    href: '/marketplace?category=fun-and-craft'
  },
  {
    id: 'transport',
    name: 'Transportation',
    categoryKey: 'Transportation',
    href: '/marketplace?category=transportation'
  },
  {
    id: 'tech',
    name: 'Tech & Gadgets',
    categoryKey: 'Tech & Gadgets',
    href: '/marketplace?category=tech-and-gadgets'
  },
  {
    id: 'clothing',
    name: 'Clothing & Accessories',
    categoryKey: 'Clothing & Accessories',
    href: '/marketplace?category=clothing-and-accessories'
  },
  {
    id: 'giveaways',
    name: 'Giveaways',
    categoryKey: 'Giveaways',
    href: '/marketplace?category=giveaways'
  },
  {
    id: 'other',
    name: 'Other',
    categoryKey: 'Other',
    href: '/marketplace?category=other'
  }
]

export default function CategoryGrid() {
  return (
    <section className="w-full py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="heading-primary text-black mb-8 sm:mb-12">
          CATEGORIES
        </h2>

        {/* ALL Button */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <Link
            href="/marketplace"
            className="inline-block px-12 py-3 border-2 border-black text-black font-medium text-sm tracking-[-0.03em] uppercase rounded-full hover:bg-black hover:text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/30"
          >
            ALL
          </Link>
        </div>

        {/* Category Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="md:grid md:grid-cols-3 lg:grid-cols-7 md:gap-8 lg:gap-12">
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
            <div className="flex gap-6 min-w-max">
              {categories.map((category) => {
                return (
                  <Link
                    key={category.id}
                    href={category.href}
                    className="flex flex-col items-center group focus:outline-none focus:ring-4 focus:ring-black/30 rounded-lg p-2"
                    style={{ minWidth: '80px' }}
                  >
                    {/* Phosphor Icon */}
                    <div className="w-16 h-16 flex items-center justify-center mb-2 text-black group-hover:scale-110 transition-transform duration-200">
                      <CategoryIcon category={category.categoryKey} size={48} className="text-black" />
                    </div>

                    {/* Label */}
                    <span className="text-xs font-medium text-black text-center group-hover:underline whitespace-nowrap">
                      {category.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop: Grid (hidden on mobile) */}
          <div className="hidden md:contents">
            {categories.map((category) => {
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className="flex flex-col items-center group focus:outline-none focus:ring-4 focus:ring-black/30 rounded-lg p-4 -m-4"
                >
                  {/* Phosphor Icon */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4 text-black group-hover:scale-110 transition-transform duration-200">
                    <CategoryIcon category={category.categoryKey} size={64} className="text-black" />
                  </div>

                  {/* Label */}
                  <span className="text-xs sm:text-sm font-medium text-black text-center group-hover:underline">
                    {category.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
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
    </section>
  )
}
