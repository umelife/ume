'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/mixpanel/client'

/**
 * Share button — the referral loop's viral unit. Opens the native share sheet
 * (Instagram/Snap/messages) with the link, baking in the current user's
 * referral code (their username) so signups can be attributed back to them.
 * Falls back to copy-to-clipboard on desktop.
 */
export default function ShareButton({
  path,
  title,
  refCode,
  label = 'Share',
  className = '',
  hint,
}: {
  path: string
  title: string
  refCode?: string
  label?: string
  className?: string
  hint?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://ume-life.com'
    const url = `${origin}${path}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ''}`

    trackEvent('share_listing', { path, has_ref: !!refCode })

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        /* user cancelled — ignore */
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleShare}
        className={`w-full flex items-center justify-center gap-2 h-11 rounded-full border border-ume-pink/40 text-ume-pink font-semibold text-sm hover:bg-ume-pink/5 transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'Link copied!' : label}
      </button>
      {hint && <p className="mt-1.5 text-[11px] text-gray-400 text-center leading-snug">{hint}</p>}
    </div>
  )
}
