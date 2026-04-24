'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface LocationRadiusSliderProps {
  initialRadius?: number
  userLat?: number
  userLng?: number
}

const DEFAULT_RADIUS = 25
const MAX_SLIDER = 100

export default function LocationRadiusSlider({
  initialRadius = DEFAULT_RADIUS,
  userLat,
  userLng,
}: LocationRadiusSliderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [radius, setRadius] = useState(initialRadius)
  const [inputValue, setInputValue] = useState(String(initialRadius))
  const [hasLocation, setHasLocation] = useState(!!(userLat && userLng))
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Keep in sync when URL params change (e.g. navigation)
  useEffect(() => {
    if (userLat && userLng) {
      setHasLocation(true)
    }
  }, [userLat, userLng])

  useEffect(() => {
    setRadius(initialRadius)
    setInputValue(String(initialRadius))
  }, [initialRadius])

  // Push radius to URL (debounced)
  function pushRadius(newRadius: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('radius', newRadius.toString())
      router.push(`/marketplace?${params.toString()}`)
    }, 300)
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value)
    setRadius(val)
    setInputValue(String(val))
    pushRadius(val)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  function handleInputBlur() {
    const parsed = parseInt(inputValue)
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(parsed, 9999) // no hard cap — user can type anything
      setRadius(Math.min(clamped, MAX_SLIDER)) // slider visual caps at MAX_SLIDER
      setInputValue(String(clamped))
      pushRadius(clamped)
    } else {
      // Reset to current radius if invalid
      setInputValue(String(radius))
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('userLat', pos.coords.latitude.toString())
        params.set('userLng', pos.coords.longitude.toString())
        params.set('radius', radius.toString())
        router.push(`/marketplace?${params.toString()}`)
        setHasLocation(true)
        setIsLoadingLocation(false)
      },
      () => {
        setIsLoadingLocation(false)
        alert('Unable to get your location. Please enable location services.')
      }
    )
  }

  function clearLocation() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('userLat')
    params.delete('userLng')
    params.delete('radius')
    router.push(`/marketplace?${params.toString()}`)
    setHasLocation(false)
    setRadius(DEFAULT_RADIUS)
    setInputValue(String(DEFAULT_RADIUS))
  }

  // Cleanup
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // ── No location yet ────────────────────────────────────────────────────────
  if (!hasLocation) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</p>
        <button
          onClick={requestLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-1.5 text-sm text-ume-indigo font-medium hover:underline disabled:opacity-50"
        >
          {isLoadingLocation ? (
            <span className="w-3.5 h-3.5 border-2 border-ume-indigo/30 border-t-ume-indigo rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {isLoadingLocation ? 'Getting location…' : 'Enable location filter'}
        </button>
      </div>
    )
  }

  // ── Location active ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</p>
        <button
          onClick={clearLocation}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          aria-label="Clear location filter"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={MAX_SLIDER}
        step={1}
        value={Math.min(radius, MAX_SLIDER)}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ume-slider"
        aria-label="Distance radius"
        aria-valuetext={`${radius} miles`}
      />

      {/* Readout + manual input */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1">
          <input
            type="number"
            min={1}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-12 text-sm font-semibold text-ume-indigo bg-transparent focus:outline-none text-center"
            aria-label="Radius in miles"
          />
          <span className="text-xs text-indigo-400 font-medium">mi</span>
        </div>
        <span className="text-xs text-gray-400">— type any value</span>
      </div>

      <style jsx>{`
        .ume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #312e81;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: transform 0.15s ease;
        }
        .ume-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .ume-slider::-webkit-slider-thumb:active { transform: scale(0.95); }
        .ume-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #312e81;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }
        .ume-slider:focus { outline: none; }
        .ume-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(79,70,229,0.3);
        }
        /* Chrome track fill via background gradient is set via JS, skip for simplicity */
      `}</style>
    </div>
  )
}
