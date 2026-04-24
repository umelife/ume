'use client'

/**
 * CreateListingInteractive
 *
 * Client component for the interactive parts of the create-listing form:
 * - Category pill selector
 * - Condition badge selector
 *
 * Each selection writes to a hidden <input> so the parent server-action
 * form receives the value normally via FormData.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'Dorm and Decor',            emoji: '🛋️' },
  { value: 'Fun and Craft',             emoji: '🎨' },
  { value: 'Transportation',            emoji: '🚲' },
  { value: 'Tech and Gadgets',          emoji: '💻' },
  { value: 'Books',                     emoji: '📚' },
  { value: 'Clothing and Accessories',  emoji: '👗' },
  { value: 'Giveaways',                 emoji: '🎁' },
  { value: 'Other',                     emoji: '📦' },
]

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished'] as const

const CONDITION_COLORS: Record<string, { bg: string; text: string; border: string; activeBg: string; activeText: string }> = {
  'New':         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', activeBg: 'bg-emerald-500', activeText: 'text-white' },
  'Like New':    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     activeBg: 'bg-sky-500',     activeText: 'text-white' },
  'Used':        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   activeBg: 'bg-amber-500',   activeText: 'text-white' },
  'Refurbished': { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  activeBg: 'bg-purple-500',  activeText: 'text-white' },
}

interface Props {
  defaultCategory?: string
  defaultCondition?: string
}

export default function CreateListingInteractive({
  defaultCategory = '',
  defaultCondition = 'Used',
}: Props) {
  const [category, setCategory]   = useState(defaultCategory)
  const [condition, setCondition] = useState(defaultCondition)

  return (
    <>
      {/* ── Category pills ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Category <span className="text-muted-foreground font-normal">(required)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, emoji }) => {
            const isActive = category === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(isActive ? '' : value)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ume-indigo focus:ring-offset-2',
                  isActive
                    ? 'bg-ume-indigo text-white border-ume-indigo shadow-sm'
                    : 'bg-white text-ume-indigo border-ume-indigo/30 hover:border-ume-indigo/70 hover:bg-indigo-50'
                )}
                aria-pressed={isActive}
              >
                <span aria-hidden="true">{emoji}</span>
                {value}
              </button>
            )
          })}
        </div>
        {/* Hidden input consumed by the server action */}
        <input type="hidden" name="category" value={category || 'Other'} />
        {!category && (
          <p className="text-xs text-muted-foreground mt-2">Select a category above</p>
        )}
      </div>

      {/* ── Condition badge selector ─────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Condition <span className="text-muted-foreground font-normal">(required)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const isActive = condition === c
            const colors = CONDITION_COLORS[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isActive
                    ? `${colors.activeBg} ${colors.activeText} border-transparent shadow-sm`
                    : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`
                )}
                aria-pressed={isActive}
              >
                {c}
              </button>
            )
          })}
        </div>
        {/* Hidden input consumed by the server action */}
        <input type="hidden" name="condition" value={condition} />
      </div>
    </>
  )
}
