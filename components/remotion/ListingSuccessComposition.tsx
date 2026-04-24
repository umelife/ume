'use client'

/**
 * ListingSuccessComposition
 *
 * A 3-second (90 frame @ 30fps) celebration animation shown after a user
 * successfully creates a listing. Confetti burst + "Listed!" text reveal.
 *
 * Embed with <ListingSuccessPlayer /> (client component below).
 */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  random,
} from 'remotion'

// ─── Confetti dot ────────────────────────────────────────────────────────────

interface ConfettiDotProps {
  seed: number
  delay: number
}

const COLORS = ['#130170', '#fa9ebc', '#34d399', '#fbbf24', '#60a5fa', '#f472b6']

function ConfettiDot({ seed, delay }: ConfettiDotProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const color = COLORS[Math.floor(random(seed + 'color') * COLORS.length)]
  const startX = 50 + random(seed + 'x') * 80 - 40
  const velocityX = random(seed + 'vx') * 120 - 60
  const velocityY = -(random(seed + 'vy') * 200 + 80)
  const size = 6 + random(seed + 'size') * 8
  const shape = random(seed + 'shape') > 0.5 ? '50%' : '2px'

  const localFrame = Math.max(0, frame - delay)
  const progress = spring({ frame: localFrame, fps, config: { damping: 40, stiffness: 80 }, durationInFrames: 50 })

  const x = startX + velocityX * progress
  const gravity = 300 * (localFrame / fps) ** 2
  const y = 50 + velocityY * progress + gravity
  const opacity = interpolate(localFrame, [0, 5, 55, 70], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
  const rotation = random(seed + 'rot') * 360 + localFrame * (random(seed + 'rotspeed') * 8 + 2)

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: color,
        borderRadius: shape,
        opacity,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  )
}

// ─── Main composition ────────────────────────────────────────────────────────

export function ListingSuccessComposition() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Checkmark scale in
  const checkScale = spring({ frame, fps, config: { damping: 12, stiffness: 180 }, durationInFrames: 20 })

  // "Listed!" text
  const textProgress = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 140 }, durationInFrames: 25 })
  const textY = interpolate(textProgress, [0, 1], [20, 0])

  // Sub-text
  const subProgress = spring({ frame: frame - 20, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 20 })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #f3f7f8 0%, #eef2ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Confetti burst — 28 dots */}
      {Array.from({ length: 28 }, (_, i) => (
        <ConfettiDot key={i} seed={i} delay={i % 4} />
      ))}

      {/* Centre card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 12px 40px rgba(19,1,112,0.12)',
          border: '1.5px solid rgba(19,1,112,0.06)',
          transform: `scale(${interpolate(checkScale, [0, 1], [0.6, 1])})`,
          opacity: checkScale,
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Check circle */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#130170',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${checkScale})`,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#fa9ebc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: interpolate(frame, [8, 28], [30, 0], { extrapolateRight: 'clamp' }),
              }}
            />
          </svg>
        </div>

        {/* "Listed!" */}
        <div
          style={{
            fontFamily: "'Archivo Black', Arial Black, sans-serif",
            fontWeight: 900,
            fontSize: 36,
            color: '#130170',
            letterSpacing: '-0.03em',
            opacity: textProgress,
            transform: `translateY(${textY}px)`,
          }}
        >
          Listed!
        </div>

        {/* Sub-text */}
        <div
          style={{
            color: 'rgba(19,1,112,0.55)',
            fontSize: 15,
            textAlign: 'center',
            opacity: subProgress,
            maxWidth: 240,
            lineHeight: 1.5,
          }}
        >
          Your listing is now live on the marketplace
        </div>
      </div>
    </AbsoluteFill>
  )
}
