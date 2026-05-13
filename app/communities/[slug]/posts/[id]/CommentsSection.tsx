'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { createComment } from '@/app/communities/actions'
import type { PostComment } from '@/types/database'

interface Props {
  postId: string
  topLevel: PostComment[]
  replyMap: Record<string, PostComment[]>
  isLoggedIn: boolean
  communitySlug: string
}

export default function CommentsSection({ postId, topLevel, replyMap, isLoggedIn, communitySlug }: Props) {
  const router = useRouter()
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)
  const [topBody, setTopBody] = useState('')
  const [topPending, startTopTransition] = useTransition()
  const [topError, setTopError] = useState<string | null>(null)

  function submitTop(e: React.FormEvent) {
    e.preventDefault()
    if (!topBody.trim()) return
    startTopTransition(async () => {
      const res = await createComment({ post_id: postId, body: topBody })
      if (res.error) { setTopError(res.error); return }
      setTopBody('')
      setTopError(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {/* Top-level composer */}
      {isLoggedIn ? (
        <form onSubmit={submitTop} className="bg-white rounded-2xl border border-gray-100 p-4">
          <textarea
            value={topBody}
            onChange={e => setTopBody(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full text-sm text-gray-800 placeholder-gray-400 border-none outline-none resize-none focus:ring-0"
          />
          {topError && <p className="text-xs text-red-500 mb-2">{topError}</p>}
          <div className="flex justify-end border-t border-gray-100 pt-3 mt-1">
            <button
              type="submit"
              disabled={!topBody.trim() || topPending}
              className="bg-ume-indigo text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-indigo-800 transition-colors disabled:opacity-50"
            >
              {topPending ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>
      ) : (
        <a
          href={`/login?redirect=/communities/${communitySlug}/posts/${postId}`}
          className="block w-full text-center text-sm text-ume-indigo font-semibold border border-ume-indigo rounded-full py-2.5 hover:bg-ume-indigo hover:text-white transition-colors"
        >
          Sign in to comment
        </a>
      )}

      {/* Comment threads */}
      {topLevel.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No comments yet — start the conversation.</p>
        </div>
      ) : (
        topLevel.map(comment => (
          <div key={comment.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <CommentItem comment={comment} />

            {/* Replies */}
            {(replyMap[comment.id] ?? []).length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                {replyMap[comment.id].map(r => <CommentItem key={r.id} comment={r} />)}
              </div>
            )}

            {/* Reply button + inline form */}
            {isLoggedIn && (
              openReplyId === comment.id ? (
                <ReplyComposer
                  postId={postId}
                  parentId={comment.id}
                  onDone={() => { setOpenReplyId(null); router.refresh() }}
                  onCancel={() => setOpenReplyId(null)}
                />
              ) : (
                <button
                  onClick={() => setOpenReplyId(comment.id)}
                  className="mt-2 text-[10px] text-gray-400 hover:text-ume-indigo font-semibold transition-colors"
                >
                  Reply
                </button>
              )
            )}
          </div>
        ))
      )}
    </div>
  )
}

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-1">
        <span className="font-semibold text-gray-600">
          @{comment.author?.username || comment.author?.display_name}
        </span>
        {' · '}
        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
      </p>
      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{comment.body}</p>
    </div>
  )
}

function ReplyComposer({ postId, parentId, onDone, onCancel }: {
  postId: string
  parentId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const res = await createComment({ post_id: postId, body, parent_id: parentId })
      if (res.error) { setError(res.error); return }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pl-4 border-l-2 border-ume-indigo/30">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        autoFocus
        className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ume-indigo/30 resize-none"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={!body.trim() || isPending}
          className="bg-ume-indigo text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-indigo-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Posting...' : 'Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
