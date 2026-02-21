'use client'

import { useState, useEffect } from 'react'
import { changelog } from '@/data/changelog'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false)

  const latestEntry = changelog[0]

  useEffect(() => {
    if (!latestEntry) return

    // Only show if latest entry is within the last 7 days
    const entryDate = new Date(latestEntry.date).getTime()
    const now = Date.now()
    if (now - entryDate > SEVEN_DAYS_MS) return

    // Only show if user hasn't dismissed this version
    const dismissedKey = `whatsNew_dismissed_${latestEntry.date}`
    if (localStorage.getItem(dismissedKey)) return

    setVisible(true)
  }, [latestEntry])

  const dismiss = () => {
    setVisible(false)
    if (latestEntry) {
      localStorage.setItem(`whatsNew_dismissed_${latestEntry.date}`, '1')
    }
  }

  if (!visible) return null

  // Show all entries from the last 7 days
  const recentEntries = changelog.filter((entry) => {
    const entryDate = new Date(entry.date).getTime()
    return Date.now() - entryDate <= SEVEN_DAYS_MS
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-5 pr-6">
          <p className="text-xs font-semibold text-ume-pink uppercase tracking-widest mb-1">Update</p>
          <h2 className="text-2xl font-black text-ume-indigo">What&apos;s New</h2>
        </div>

        {/* Entries */}
        <div className="space-y-5">
          {recentEntries.map((entry) => (
            <div key={entry.date}>
              <p className="text-xs font-medium text-gray-400 mb-2.5">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <ul className="space-y-2.5">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ume-indigo flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Got it button */}
        <button
          onClick={dismiss}
          className="mt-6 w-full py-2.5 bg-ume-indigo text-white rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
