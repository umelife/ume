import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const s = Math.min(Math.max(parseInt(size) || 192, 32), 1024)
  const fontSize = Math.round(s * 0.38)
  const padding = Math.round(s * 0.08)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="white"/>
  <text x="${s / 2}" y="${s / 2 + fontSize * 0.15}" dominant-baseline="middle" text-anchor="middle" font-family="Arial Black, Helvetica Neue, sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="${-padding}">
    <tspan fill="#312e81">U</tspan><tspan fill="#f9a8d4">ME</tspan>
  </text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
