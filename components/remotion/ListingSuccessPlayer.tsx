'use client'

/**
 * ListingSuccessPlayer
 *
 * Wraps the Remotion Player with the listing-success celebration animation.
 * Play it once when the user lands on the success screen after posting a listing.
 *
 * Usage:
 *   import ListingSuccessPlayer from '@/components/remotion/ListingSuccessPlayer'
 *   <ListingSuccessPlayer />
 */

import { Player } from '@remotion/player'
import { ListingSuccessComposition } from './ListingSuccessComposition'
import { useEffect, useState } from 'react'

export default function ListingSuccessPlayer({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <Player
        component={ListingSuccessComposition}
        durationInFrames={90}
        fps={30}
        compositionWidth={400}
        compositionHeight={280}
        style={{ width: '100%', height: 'auto', aspectRatio: '400/280', borderRadius: 16, overflow: 'hidden' }}
        autoPlay
        loop={false}
        controls={false}
        clickToPlay={false}
        showVolumeControls={false}
        renderLoading={() => null}
        errorFallback={() => null}
      />
    </div>
  )
}
