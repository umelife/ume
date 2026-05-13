'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { votePost, deletePost } from '@/app/communities/actions'
import type { CommunityPost } from '@/types/database'

interface Props {
  post: CommunityPost
  communitySlug: string
  communityId: string
  currentUserId?: string
  isModerator?: boolean
}

export default function PostCard({ post, communitySlug, communityId, currentUserId, isModerator }: Props) {
  const router = useRouter()
  const [votes, setVotes] = useState(post.upvote_count)
  const [voted, setVoted] = useState(post.has_voted ?? false)
  const [deleted, setDeleted] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (deleted) return null

  const canDelete = currentUserId && (post.author_id === currentUserId || isModerator)

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('Delete this post?')) return
    startTransition(async () => {
      const res = await deletePost(post.id, communityId)
      if (!res.error) setDeleted(true)
    })
  }

  function handleVote(e: React.MouseEvent) {
    e.preventDefault()
    if (!currentUserId) return
    const wasVoted = voted
    setVoted(!wasVoted)
    setVotes(v => wasVoted ? v - 1 : v + 1)
    startTransition(async () => { await votePost(post.id, wasVoted) })
  }

  const age = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
            <button
              onClick={handleVote}
              disabled={!currentUserId || isPending}
              aria-label="Upvote"
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                voted
                  ? 'bg-ume-indigo text-white'
                  : 'text-gray-400 hover:bg-ume-indigo/10 hover:text-ume-indigo'
              } disabled:opacity-40`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-700 tabular-nums">{votes}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 mb-1">
              <span className="font-semibold text-gray-600">@{post.author?.username || post.author?.display_name}</span>
              {' · '}{age}
            </p>
            <Link href={`/communities/${communitySlug}/posts/${post.id}`} className="block group">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-ume-indigo transition-colors line-clamp-2">
                {post.title}
              </h3>
              {post.body && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.body}</p>
              )}
            </Link>

            {/* Image preview */}
            {post.type === 'image' && post.image_urls.length > 0 && (
              <div className="mt-2 relative w-full max-h-60 rounded-xl overflow-hidden">
                <Image
                  src={post.image_urls[0]}
                  alt=""
                  width={600}
                  height={400}
                  unoptimized
                  className="w-full object-cover max-h-60"
                />
              </div>
            )}

            {/* Link preview */}
            {post.type === 'link' && post.link_url && (
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-[10px] text-ume-indigo hover:underline"
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate">{post.link_url}</span>
              </a>
            )}

            <div className="mt-2 flex items-center gap-3">
            <Link
              href={`/communities/${communitySlug}/posts/${post.id}`}
              className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-ume-indigo transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
            </Link>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
