'use client'

import { useState, useTransition } from 'react'
import { votePost } from '@/app/communities/actions'

export default function PostVoteButton({
  postId,
  initialVotes,
  initialVoted,
  isLoggedIn,
}: {
  postId: string
  initialVotes: number
  initialVoted: boolean
  isLoggedIn: boolean
}) {
  const [votes, setVotes] = useState(initialVotes)
  const [voted, setVoted] = useState(initialVoted)
  const [isPending, startTransition] = useTransition()

  function handleVote() {
    if (!isLoggedIn) return
    const wasVoted = voted
    setVoted(!wasVoted)
    setVotes(v => wasVoted ? v - 1 : v + 1)
    startTransition(async () => { await votePost(postId, wasVoted) })
  }

  return (
    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
      <button
        onClick={handleVote}
        disabled={!isLoggedIn || isPending}
        aria-label="Upvote"
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
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
  )
}
