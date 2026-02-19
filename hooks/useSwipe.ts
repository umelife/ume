import { useRef } from 'react'

/**
 * Detects horizontal swipe gestures on touch devices.
 * @param onSwipeLeft - Called when user swipes left (next)
 * @param onSwipeRight - Called when user swipes right (previous)
 * @param threshold - Minimum px delta to trigger (default 50)
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const touchStartX = useRef<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) >= threshold) {
      if (delta < 0) {
        onSwipeLeft()
      } else {
        onSwipeRight()
      }
    }
    touchStartX.current = null
  }

  return { onTouchStart, onTouchEnd }
}
