'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/communities/actions'

interface Props {
  communityId: string
  communitySlug: string
}

export default function PostComposer({ communityId, communitySlug }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'text' | 'link'>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function reset() {
    setTitle(''); setBody(''); setLinkUrl(''); setError(null)
  }

  function submit() {
    if (!title.trim()) { setError('Title is required'); return }
    setError(null)
    startTransition(async () => {
      const res = await createPost({
        community_id: communityId,
        type: tab,
        title: title.trim(),
        body: body.trim() || undefined,
        link_url: tab === 'link' ? linkUrl.trim() : undefined,
      })
      if (res.error) { setError(res.error); return }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-400 hover:border-ume-indigo hover:text-ume-indigo transition-colors text-left"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Create a post
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {(['text', 'link'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? 'text-ume-indigo border-b-2 border-ume-indigo'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'text' && 'Text'}
            {t === 'link' && '🔗 Link'}
          </button>
        ))}
        <button
          onClick={() => { setOpen(false); reset() }}
          className="px-3 text-gray-400 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={300}
          className="w-full text-sm font-semibold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ume-indigo"
        />

        {tab === 'text' && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Text (optional)"
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ume-indigo resize-none"
          />
        )}

        {tab === 'link' && (
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
            placeholder="https://"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ume-indigo"
          />
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={isPending || !title.trim()}
          className="w-full bg-ume-indigo text-white font-semibold text-sm py-2.5 rounded-full hover:bg-indigo-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}
