'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelEvent } from '@/app/events/actions'

export default function CancelEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handle() {
    if (!confirm('Cancel this event? All RSVPs will be notified.')) return
    startTransition(async () => {
      const res = await cancelEvent(eventId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handle}
        disabled={isPending}
        className="w-full text-sm font-semibold text-red-600 border border-red-200 py-2.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Cancelling…' : 'Cancel event'}
      </button>
    </div>
  )
}
