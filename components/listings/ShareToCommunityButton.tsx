'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getShareTargetCommunities, shareListingToCommunity } from '@/app/communities/actions'
import { getCommunityCategory } from '@/data/community-categories'

interface Community {
  id: string
  name: string
  slug: string
  category: string
}

export default function ShareToCommunityButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [communities, setCommunities] = useState<Community[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<{ slug: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function openModal() {
    setOpen(true)
    setDone(null)
    setError(null)
    if (communities === null) {
      setLoading(true)
      try {
        setCommunities(await getShareTargetCommunities())
      } finally {
        setLoading(false)
      }
    }
  }

  function share(communityId: string) {
    setError(null)
    startTransition(async () => {
      const res = await shareListingToCommunity({ listingId, communityId })
      if (res.error) {
        setError(res.error)
        return
      }
      setDone({ slug: res.slug! })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-ume-indigo/20 text-ume-indigo font-semibold text-sm hover:bg-ume-indigo/5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share to a community
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-ume-indigo">Share to a community</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {done ? (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-ume-indigo/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Shared! Your listing is now posted in the community.</p>
                  <Link
                    href={`/communities/${done.slug}`}
                    className="inline-block text-sm font-semibold text-ume-indigo hover:underline"
                  >
                    View it in the community →
                  </Link>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-ume-indigo border-t-transparent" />
                </div>
              ) : communities && communities.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Pick a community to post this listing in:</p>
                  {communities.map((c) => {
                    const cat = getCommunityCategory(c.category)
                    return (
                      <button
                        key={c.id}
                        onClick={() => share(c.id)}
                        disabled={pending}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-ume-indigo hover:bg-ume-indigo/5 transition-colors text-left disabled:opacity-50"
                      >
                        <span className="text-xl shrink-0">{cat?.emoji ?? '✨'}</span>
                        <span className="font-semibold text-sm text-gray-900 flex-1 truncate">{c.name}</span>
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-gray-500">You haven&apos;t joined any communities yet.</p>
                  <Link href="/communities" className="inline-block text-sm font-semibold text-ume-indigo hover:underline">
                    Browse communities →
                  </Link>
                </div>
              )}

              {error && <p className="text-xs text-red-600 mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
