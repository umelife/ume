'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinCommunity, leaveCommunity } from '@/app/communities/actions'

interface Props {
  communityId: string
  isMember: boolean
  isOwner: boolean
}

export default function CommunityJoinButton({ communityId, isMember, isOwner }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      if (isMember && !isOwner) await leaveCommunity(communityId)
      else if (!isMember) await joinCommunity(communityId)
      router.refresh()
    })
  }

  if (isOwner) {
    return (
      <span className="bg-ume-indigo/10 text-ume-indigo text-xs font-bold px-4 py-2 rounded-full">
        Owner
      </span>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`font-semibold text-sm px-5 py-2 rounded-full transition-colors disabled:opacity-60 ${
        isMember
          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
          : 'bg-ume-indigo text-white hover:bg-indigo-800'
      }`}
    >
      {isPending ? '…' : isMember ? 'Joined ✓' : 'Join'}
    </button>
  )
}
