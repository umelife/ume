"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { categoryTheme } from '@/lib/listing-theme'

const CATEGORIES = [
  { slug: '', display: 'All finds', icon: '✦' },
  { slug: 'dorm-and-decor', display: 'Dorm & Decor', icon: '⌂' },
  { slug: 'fun-and-craft', display: 'Fun & Craft', icon: '✂' },
  { slug: 'books', display: 'Books', icon: '▤' },
  { slug: 'clothing-and-accessories', display: 'Clothing', icon: '♡' },
  { slug: 'transportation', display: 'Transportation', icon: '↗' },
  { slug: 'tech-and-gadgets', display: 'Tech & Gadgets', icon: '⌘' },
  { slug: 'giveaways', display: 'Giveaways', icon: '★' },
  { slug: 'other', display: 'Other', icon: '＋' },
]

export default function CategoryBar({ currentCategory }: { currentCategory?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  function choose(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!slug || currentCategory === slug) params.delete('category')
    else params.set('category', slug)
    router.push(`/marketplace?${params.toString()}`)
  }
  return <div className="arcade-categories scrollbar-hide" aria-label="Listing categories">
    {CATEGORIES.map((category,index) => <button key={category.slug} type="button" onClick={()=>choose(category.slug)} style={categoryTheme(index)} className="arcade-chip" aria-pressed={(currentCategory || '') === category.slug} aria-label={category.slug ? `Filter by ${category.display}` : 'View all categories'}><span aria-hidden="true">{category.icon}</span>{category.display}{(currentCategory || '') === category.slug && <span aria-hidden="true">✓</span>}</button>)}
  </div>
}
