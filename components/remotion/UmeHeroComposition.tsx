'use client'

/**
 * UME Hero Remotion Composition
 *
 * A 5-second (150 frame @ 30fps) animated hero that plays inline on the
 * homepage using @remotion/player. No server-side rendering or CLI needed.
 *
 * Sequence:
 *  0–20   Background gradient blooms in
 *  0–30   "UME" logo letters stagger-scale in
 *  25–60  Headline words fade + slide up
 *  45–80  Subheadline fades in
 *  60–90  CTA buttons appear
 *  70–150 Floating product-card mockups orbit gently
 */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useFade(from: number, to: number) {
  const frame = useCurrentFrame()
  return interpolate(frame, [from, to], [0, 1], { extrapolateRight: 'clamp' })
}

function useSlideUp(startFrame: number, distance = 28) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 30 })
  const y = interpolate(progress, [0, 1], [distance, 0])
  const opacity = interpolate(progress, [0, 0.3], [0, 1])
  return { y, opacity }
}

function useScale(startFrame: number) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 200 }, durationInFrames: 24 })
}

// ─── Floating card mockup ────────────────────────────────────────────────────

interface FloatCardProps {
  delay: number
  x: number
  y: number
  rotation: number
  label: string
  price: string
  emoji: string
  color: string
}

function FloatCard({ delay, x, y, rotation, label, price, emoji, color }: FloatCardProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const appear = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 30 })
  const float = Math.sin((frame + delay * 12) / 40) * 8
  const opacity = interpolate(appear, [0, 0.2], [0, 1])
  const scale = appear

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + float,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        opacity,
        width: 130,
        background: '#ffffff',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(19,1,112,0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        border: '1.5px solid rgba(19,1,112,0.07)',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          height: 72,
          borderRadius: 10,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
        }}
      >
        {emoji}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#130170', lineHeight: 1.2, fontFamily: 'system-ui' }}>
        {label}
      </div>
      <div
        style={{
          background: '#130170',
          color: '#fff',
          borderRadius: 20,
          padding: '2px 8px',
          fontSize: 11,
          fontWeight: 700,
          alignSelf: 'flex-start',
          fontFamily: 'system-ui',
        }}
      >
        {price}
      </div>
    </div>
  )
}

// ─── Logo Letter ─────────────────────────────────────────────────────────────

function LogoLetter({ char, delay, color }: { char: string; delay: number; color: string }) {
  const scale = useScale(delay)
  const opacity = interpolate(scale, [0, 0.4], [0, 1])
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${scale})`,
        opacity,
        color,
        fontFamily: "'Archivo Black', Arial Black, sans-serif",
        fontWeight: 900,
        fontSize: 80,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}
    >
      {char}
    </span>
  )
}

// ─── Trust pill ──────────────────────────────────────────────────────────────

function TrustPill({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const appear = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 20 })
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 100,
        padding: '6px 14px',
        opacity: appear,
        transform: `translateY(${interpolate(appear, [0, 1], [10, 0])}px)`,
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'system-ui',
        fontWeight: 500,
      }}
    >
      <span style={{ color: '#fa9ebc' }}>✓</span>
      {text}
    </div>
  )
}

// ─── Main Composition ────────────────────────────────────────────────────────

export function UmeHeroComposition() {
  const frame = useCurrentFrame()

  // Background gradient animate-in
  const bgOpacity = interpolate(frame, [0, 20], [0.6, 1], { extrapolateRight: 'clamp' })

  // Headline words
  const h1 = useSlideUp(28)
  const h2 = useSlideUp(36)
  const h3 = useSlideUp(44)

  // Subhead
  const sub = useSlideUp(52)

  // Glow blobs pulsing
  const glow1 = 0.12 + Math.sin(frame / 35) * 0.05
  const glow2 = 0.1 + Math.sin(frame / 28 + 1.5) * 0.04

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #130170 0%, #1d01a8 45%, #0a0040 100%)`,
        opacity: bgOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.04,
        }}
      />

      {/* Pink glow */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: -40,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(250,158,188,${glow1}) 0%, transparent 70%)`,
        }}
      />

      {/* Indigo glow */}
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          right: -60,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(99,102,241,${glow2}) 0%, transparent 70%)`,
        }}
      />

      {/* Floating product cards */}
      <FloatCard delay={70} x={28} y={60}  rotation={-6}  label='MacBook Pro 14"' price="$850" emoji="💻" color="#e0e7ff" />
      <FloatCard delay={80} x={760} y={80}  rotation={5}   label="Calculus Textbook" price="$35"  emoji="📚" color="#fce7f3" />
      <FloatCard delay={90} x={820} y={300} rotation={-4}  label="IKEA Desk Chair"  price="$60"  emoji="🪑" color="#d1fae5" />
      <FloatCard delay={85} x={18}  y={320} rotation={4}   label="Nike Air Force 1" price="$70"  emoji="👟" color="#fef3c7" />

      {/* Centre content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
          <LogoLetter char="U" delay={0}  color="#ffffff" />
          <LogoLetter char="M" delay={6}  color="#fa9ebc" />
          <LogoLetter char="E" delay={12} color="#fa9ebc" />
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              opacity: h1.opacity,
              transform: `translateY(${h1.y}px)`,
            }}
          >
            Buy & sell within
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#fa9ebc',
              opacity: h2.opacity,
              transform: `translateY(${h2.y}px)`,
            }}
          >
            your campus community
          </div>
        </div>

        {/* Subhead */}
        <p
          style={{
            marginTop: 20,
            color: 'rgba(255,255,255,0.65)',
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 420,
            textAlign: 'center',
            opacity: sub.opacity,
            transform: `translateY(${sub.y}px)`,
          }}
        >
          Verified students. Zero fees. Safe campus meetups.
        </p>

        {/* Trust pills */}
        <Sequence from={70}>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <TrustPill text=".edu verified" delay={0} />
            <TrustPill text="Safe handshake meetups" delay={8} />
            <TrustPill text="100% free" delay={16} />
          </div>
        </Sequence>
      </div>
    </AbsoluteFill>
  )
}
