'use client'

/**
 * TypingIndicatorPlayer
 *
 * A tiny inline Remotion Player rendering the animated three-dot typing
 * indicator. Drop it in where you'd show "… is typing".
 *
 * Usage:
 *   import TypingIndicatorPlayer from '@/components/remotion/TypingIndicatorPlayer'
 *   {isTyping && <TypingIndicatorPlayer />}
 */

import { Player } from '@remotion/player'
import { TypingIndicatorComposition } from './TypingIndicatorComposition'
import { useEffect, useState } from 'react'

export default function TypingIndicatorPlayer() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      className="inline-flex items-center bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100"
      style={{ height: 36 }}
      aria-label="Typing…"
    >
      <Player
        component={TypingIndicatorComposition}
        durationInFrames={60}
        fps={30}
        compositionWidth={48}
        compositionHeight={20}
        style={{ width: 48, height: 20 }}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        showVolumeControls={false}
        renderLoading={() => null}
        errorFallback={() => null}
      />
    </div>
  )
}
