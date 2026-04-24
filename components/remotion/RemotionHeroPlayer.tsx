'use client'

/**
 * RemotionHeroPlayer
 *
 * Client component that mounts the @remotion/player with the UME hero
 * animation. Autoplays, loops, and is muted by default. Gracefully
 * hides on prefers-reduced-motion.
 *
 * Usage:
 *   import RemotionHeroPlayer from '@/components/remotion/RemotionHeroPlayer'
 *   <RemotionHeroPlayer />
 */

import { Player } from '@remotion/player'
import { UmeHeroComposition } from './UmeHeroComposition'
import { useEffect, useState } from 'react'

export default function RemotionHeroPlayer() {
  const [reduced, setReduced] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!mounted || reduced) return null

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <Player
        component={UmeHeroComposition}
        durationInFrames={150}
        fps={30}
        compositionWidth={1000}
        compositionHeight={500}
        style={{ width: '100%', height: '100%' }}
        autoPlaybackRate={1}
        loop
        autoPlay
        controls={false}
        clickToPlay={false}
        showVolumeControls={false}
        renderLoading={() => null}
        errorFallback={() => null}
      />
    </div>
  )
}
