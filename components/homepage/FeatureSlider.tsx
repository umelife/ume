'use client'

/**
 * FeatureSlider Component (Owl Carousel Style)
 *
 * Three feature cards with fluid owl carousel effect:
 * - Center card is large with beige/cream background
 * - Side cards are smaller, more rectangular with dark indigo border
 * - Smooth animated transitions between positions
 * - Cards slide and scale as they move between positions
 * - Gap between panels for visual separation
 * - Works on both desktop and mobile
 * - Auto-rotating animation
 * - Dot indicators only on center card
 */

import { useState, useEffect, useCallback } from 'react'
import { useSwipe } from '@/hooks/useSwipe'

interface Slide {
  id: string
  headline: string
  subtitle: string
  icon?: React.ReactNode
}

interface FeatureSliderProps {
  slides?: Slide[]
  autoPlayInterval?: number
}

const defaultSlides: Slide[] = [
  {
    id: '1',
    headline: 'REAL-TIME CHAT',
    subtitle: 'Message sellers instantly and arrange pickups easily',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    id: '2',
    headline: 'VERIFIED STUDENTS ONLY',
    subtitle: '.edu email verification ensures you\'re trading within your campus community',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    )
  },
  {
    id: '3',
    headline: 'SAFE & SIMPLE',
    subtitle: 'Report inappropriate listings and trade with confidence',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    )
  }
]

type CardPosition = 'left' | 'center' | 'right'

export default function FeatureSlider({
  slides = defaultSlides,
  autoPlayInterval = 4000
}: FeatureSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const goToNext = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsAnimating(false), 600)
  }, [slides.length, isAnimating])

  const goToPrev = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsAnimating(false), 600)
  }, [slides.length, isAnimating])

  const { onTouchStart, onTouchEnd } = useSwipe(goToNext, goToPrev)

  // Auto-play
  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isPaused, goToNext, autoPlayInterval, slides.length])

  if (slides.length === 0) return null

  // Get the position of each card relative to current index
  const getCardPosition = (cardIndex: number): CardPosition => {
    const diff = (cardIndex - currentIndex + slides.length) % slides.length
    if (diff === 0) return 'center'
    if (diff === 1 || (diff === slides.length - 2 && slides.length === 3)) return 'right'
    if (diff === slides.length - 1 || (diff === 2 && slides.length === 3)) return 'left'
    return 'center'
  }

  // Get styles for each position with responsive sizing
  const getCardStyles = (position: CardPosition, isCenter: boolean): React.CSSProperties => {
    // Base dimensions - responsive
    // Side cards are more rectangular (wider than tall)
    const centerWidth = isMobile ? 280 : 460
    const sideWidth = isMobile ? 160 : 260  // Wider
    const centerHeight = isMobile ? 160 : 200  // Compact height for tight layout
    const sideHeight = isMobile ? 120 : 180  // Shorter - more rectangular
    const gapPixels = isMobile ? 15 : 35 // Gap between cards

    // Calculate offset including gap
    const sideOffset = (centerWidth / 2) + (sideWidth / 2) + gapPixels
    const sideScale = isMobile ? 0.9 : 0.9

    const baseStyles: React.CSSProperties = {
      width: isCenter ? centerWidth : sideWidth,
      height: isCenter ? 'auto' : sideHeight,
      minHeight: isCenter ? centerHeight : 'auto',
      padding: isCenter ? (isMobile ? 20 : 32) : (isMobile ? 14 : 20),
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
    }

    switch (position) {
      case 'left':
        return {
          ...baseStyles,
          transform: `translateX(-${sideOffset}px) scale(${sideScale})`,
          opacity: 0.8,
          zIndex: 10,
        }
      case 'center':
        return {
          ...baseStyles,
          transform: 'translateX(0) scale(1)',
          opacity: 1,
          zIndex: 30,
        }
      case 'right':
        return {
          ...baseStyles,
          transform: `translateX(${sideOffset}px) scale(${sideScale})`,
          opacity: 0.8,
          zIndex: 10,
        }
    }
  }

  return (
    <section
      className="relative w-full py-2 sm:py-3 md:py-4 bg-ume-cream overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Feature carousel"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        {/* Cards Container */}
        <div className="relative flex items-center justify-center min-h-[180px] sm:min-h-[200px] md:min-h-[220px]">

          {/* All cards rendered with absolute positioning */}
          {slides.map((slide, index) => {
            const position = getCardPosition(index)
            const isCenter = position === 'center'
            const cardStyles = getCardStyles(position, isCenter)

            return (
              <div
                key={slide.id}
                className={`absolute flex flex-col justify-center rounded-2xl sm:rounded-3xl border-2 border-ume-indigo cursor-pointer ${
                  isCenter ? 'bg-ume-cream shadow-2xl relative' : 'bg-white hover:opacity-95'
                }`}
                style={cardStyles}
                onClick={() => {
                  if (!isCenter && !isAnimating) {
                    setIsAnimating(true)
                    setCurrentIndex(index)
                    setTimeout(() => setIsAnimating(false), 600)
                  }
                }}
              >
                {slide.icon && (
                  <div className={`text-ume-indigo mb-2 sm:mb-3 ${
                    isCenter ? 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12' : 'w-5 h-5 sm:w-6 sm:h-6'
                  }`}>
                    {slide.icon}
                  </div>
                )}
                <h3
                  className={`text-ume-indigo font-black uppercase tracking-tight ${
                    isCenter
                      ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 sm:mb-3 md:mb-4'
                      : 'text-xs sm:text-sm md:text-base lg:text-lg mb-1 sm:mb-2'
                  }`}
                >
                  {slide.headline}
                </h3>
                <p
                  className={`leading-relaxed ${
                    isCenter
                      ? 'text-gray-700 text-xs sm:text-sm md:text-base'
                      : 'text-gray-600 text-[10px] sm:text-xs line-clamp-2'
                  }`}
                >
                  {slide.subtitle}
                </p>

                {/* Dot indicators - Only on center card, positioned absolutely */}
                {isCenter && (
                  <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isAnimating) {
                            setIsAnimating(true)
                            setCurrentIndex(idx)
                            setTimeout(() => setIsAnimating(false), 600)
                          }
                        }}
                        className={`rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? 'bg-ume-indigo w-5 sm:w-6 md:w-8 h-1.5 sm:h-2 md:h-3'
                            : 'bg-gray-400 hover:bg-gray-500 w-1.5 sm:w-2 md:w-3 h-1.5 sm:h-2 md:h-3'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        </div>
      </div>
    </section>
  )
}
