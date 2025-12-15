'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * LocationRadiusSlider Component
 *
 * A slider that allows users to filter listings by distance radius.
 * Features:
 * - Requests geolocation permission from user
 * - Debounced URL updates (250ms)
 * - Keyboard accessible (aria attributes)
 * - Shows live readout of miles
 * - Tick labels at 0, 10, 25, 50 miles
 * - Disabled state when location not available
 */

interface LocationRadiusSliderProps {
  initialRadius?: number
  userLat?: number
  userLng?: number
}

const RADIUS_MARKS = [0, 10, 25, 50]
const DEFAULT_RADIUS = 25

export default function LocationRadiusSlider({
  initialRadius = DEFAULT_RADIUS,
  userLat,
  userLng
}: LocationRadiusSliderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [radius, setRadius] = useState(initialRadius)
  const [hasLocation, setHasLocation] = useState(false)
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Check if we already have location from URL
  useEffect(() => {
    if (userLat && userLng) {
      setHasLocation(true)
      setLocationPermission('granted')
    }
  }, [userLat, userLng])

  // Request geolocation permission
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // Update URL with location
        const params = new URLSearchParams(searchParams.toString())
        params.set('userLat', lat.toString())
        params.set('userLng', lng.toString())
        params.set('radius', radius.toString())

        router.push(`/marketplace?${params.toString()}`)

        setHasLocation(true)
        setLocationPermission('granted')
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationPermission('denied')
        setIsLoadingLocation(false)
        alert('Unable to get your location. Please enable location services.')
      }
    )
  }

  // Handle slider change with debouncing
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce URL update (250ms)
    debounceTimerRef.current = setTimeout(() => {
      if (hasLocation) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('radius', newRadius.toString())
        router.push(`/marketplace?${params.toString()}`)
      }
    }, 250)
  }

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        Distance
      </label>

      {/* Slider disabled state or active state */}
      {!hasLocation ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={radius}
              disabled
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-not-allowed opacity-50"
              aria-label="Distance radius"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={radius}
              aria-valuetext={`${radius} miles`}
            />
          </div>

          {/* Enable location CTA */}
          <button
            onClick={requestLocation}
            disabled={isLoadingLocation}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isLoadingLocation ? 'Getting location...' : 'Enable location'}
          </button>

          <p className="text-xs text-gray-500">
            Enable location to filter by distance
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active slider */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              aria-label="Distance radius"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={radius}
              aria-valuetext={`${radius} miles`}
            />

            {/* Tick marks */}
            <div className="flex justify-between mt-1 px-1">
              {RADIUS_MARKS.map((mark) => (
                <span
                  key={mark}
                  className="text-xs text-gray-500 select-none"
                  style={{ width: '1ch' }}
                >
                  {mark}
                </span>
              ))}
            </div>
          </div>

          {/* Live readout */}
          <div className="text-sm font-medium text-gray-900">
            {radius === 0 ? 'Any distance' : `${radius} mi`}
          </div>
        </div>
      )}

      {/* Custom slider thumb styles */}
      <style jsx>{`
        /* Webkit browsers (Chrome, Safari) */
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }

        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }

        /* Firefox */
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }

        .slider-thumb::-moz-range-thumb:active {
          transform: scale(0.95);
        }

        /* Focus styles for accessibility */
        .slider-thumb:focus {
          outline: none;
        }

        .slider-thumb:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .slider-thumb:focus-visible::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  )
}
