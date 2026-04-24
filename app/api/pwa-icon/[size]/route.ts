import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const s = Math.min(Math.max(parseInt(size) || 192, 32), 1024)
  const hs = s / 2

  // Stacked typographic layout: large "U" on top, "ME" below
  const uSize = Math.round(s * 0.52)
  const meSize = Math.round(s * 0.26)
  const uY = Math.round(s * 0.42)
  const meY = Math.round(s * 0.73)
  const dotR = Math.round(s * 0.035)
  const dotY = Math.round(s * 0.88)
  const dotSpacing = Math.round(s * 0.09)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${s}" y2="${s}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="white" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#bg)"/>
  <rect width="${s}" height="${s}" fill="url(#glow)"/>
  <text x="${hs}" y="${uY}" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial Black, Impact, Helvetica Neue, sans-serif"
    font-weight="900" font-size="${uSize}" fill="white">U</text>
  <text x="${hs}" y="${meY}" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial Black, Impact, Helvetica Neue, sans-serif"
    font-weight="900" font-size="${meSize}" fill="#f472b6" letter-spacing="${Math.round(s * 0.04)}">ME</text>
  <circle cx="${hs - dotSpacing}" cy="${dotY}" r="${dotR}" fill="#f472b6" fill-opacity="0.6"/>
  <circle cx="${hs}" cy="${dotY}" r="${dotR}" fill="#f472b6"/>
  <circle cx="${hs + dotSpacing}" cy="${dotY}" r="${dotR}" fill="#f472b6" fill-opacity="0.6"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
