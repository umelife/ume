'use client'

/**
 * TypingIndicatorComposition
 *
 * A looping 60-frame (2s @ 30fps) animation of the classic three-dot
 * typing indicator. Used inside the messages chat view.
 */

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

function Dot({ delay }: { delay: number }) {
  const frame = useCurrentFrame()
  // 0→1→0 bounce cycle every 30 frames, offset by delay
  const t = ((frame + delay) % 30) / 30
  const y = interpolate(Math.sin(t * Math.PI * 2), [-1, 1], [4, -4])
  const scale = interpolate(Math.sin(t * Math.PI * 2), [-1, 1], [0.85, 1.15])

  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'rgba(19,1,112,0.45)',
        transform: `translateY(${y}px) scale(${scale})`,
      }}
    />
  )
}

export function TypingIndicatorComposition() {
  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}
    >
      <Dot delay={0} />
      <Dot delay={10} />
      <Dot delay={20} />
    </AbsoluteFill>
  )
}
