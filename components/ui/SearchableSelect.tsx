'use client'

import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  fullWidth?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className = '',
  fullWidth = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  // Close on outside click/touch
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className={`flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors min-h-[48px] ${fullWidth ? 'w-full justify-between px-4 py-3 border border-gray-300 rounded-full bg-white' : ''}`}
      >
        <span className={selected ? 'text-ume-indigo font-medium' : ''}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute ${fullWidth ? 'left-0 right-0' : 'left-0 min-w-[220px]'} mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-30 flex flex-col overflow-hidden`}
          style={{ maxHeight: '50vh' }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100 flex-shrink-0">
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ume-indigo"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100 min-h-[48px] flex items-center"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No results</p>
            ) : (
              filtered.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 min-h-[48px] flex items-center ${
                    value === option.value ? 'text-ume-indigo font-medium bg-indigo-50' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
