'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createComment } from '@/app/communities/actions'

export default function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const res = await createComment({ post_id: postId, body })
      if (res.error) {
        setError(res.error)
      } else {
        setBody('')
        setError(null)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-4">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full text-sm text-gray-800 placeholder-gray-400 border-none outline-none resize-none focus:ring-0"
      />
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <div className="flex justify-end border-t border-gray-100 pt-3 mt-1">
        <button
          type="submit"
          disabled={!body.trim() || isPending}
          className="bg-ume-indigo text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-indigo-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Posting...' : 'Comment'}
        </button>
      </div>
    </form>
  )
}
