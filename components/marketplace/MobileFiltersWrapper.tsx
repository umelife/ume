'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import MobileFilters from './MobileFilters'

/**
 * MobileFiltersWrapper Component
 *
 * Wrapper that manages the mobile filter drawer state.
 * Listens for 'showFilters' query parameter to open the drawer.
 */

interface MobileFiltersWrapperProps {
  currentCondition?: string
  currentSort?: string
  currentMinPrice?: string
  currentMaxPrice?: string
}

export default function MobileFiltersWrapper({
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice
}: MobileFiltersWrapperProps) {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Listen for custom event from MobileHeader
  useEffect(() => {
    const handleOpenFilters = () => {
      setIsOpen(true)
    }

    window.addEventListener('openMobileFilters', handleOpenFilters)

    return () => {
      window.removeEventListener('openMobileFilters', handleOpenFilters)
    }
  }, [])

  return (
    <MobileFilters
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      currentCondition={currentCondition}
      currentSort={currentSort}
      currentMinPrice={currentMinPrice}
      currentMaxPrice={currentMaxPrice}
    />
  )
}
