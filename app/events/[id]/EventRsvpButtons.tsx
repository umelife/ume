'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rsvpEvent, cancelRsvp } from '@/app/events/actions'

interface Props {
  eventId: string
  initialStatus: 'going' | 'interested' | null
  isFull: boolean
}

export default function EventRsvpButtons({ eventId, initialStatus, isFull }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  function handle(next: 'going' | 'interested') {
    startTransition(async () => {
      if (status === next) {
        setStatus(null)
        await cancelRsvp(eventId)
      } else {
        setStatus(next)
        await rsvpEvent(eventId, next)
      }
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('going')}
        disabled={isPending || (isFull && status !== 'going')}
        className={`flex-1 font-semibold py-3 rounded-full text-sm transition-colors disabled:opacity-60 ${
          status === 'going'
            ? 'bg-ume-indigo text-white'
            : 'bg-white border-2 border-ume-indigo text-ume-indigo hover:bg-ume-indigo hover:text-white'
        }`}
      >
        {status === 'going' ? '✓ Going' : isFull ? 'Event full' : 'Going'}
      </button>
      <button
        onClick={() => handle('interested')}
        disabled={isPending}
        className={`flex-1 font-semibold py-3 rounded-full text-sm transition-colors disabled:opacity-60 ${
          status === 'interested'
            ? 'bg-ume-pink text-white'
            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-ume-pink hover:text-ume-pink'
        }`}
      >
        {status === 'interested' ? '★ Interested' : '☆ Interested'}
      </button>
    </div>
  )
}
