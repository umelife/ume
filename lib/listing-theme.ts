import type { CSSProperties } from 'react'

// A stable shuffle: each listing keeps its color across reloads and filters.
export const ARCADE_COLORS = ['#ffe66d', '#c9b6ff', '#a2e8c1', '#ffb2c7', '#a8d8ff', '#ffc49b', '#d2ed89', '#c3bfff'] as const

export function listingTheme(id: string): CSSProperties {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash * 31) + id.charCodeAt(i)) >>> 0
  return { '--listing-color': ARCADE_COLORS[hash % ARCADE_COLORS.length], '--listing-action': ARCADE_COLORS[(hash + 3) % ARCADE_COLORS.length] } as CSSProperties
}

export function categoryTheme(index: number): CSSProperties {
  return { '--chip-color': ARCADE_COLORS[index % ARCADE_COLORS.length] } as CSSProperties
}
