'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTotalUnreadCountEnhanced } from '@/lib/chat/enhanced-actions'

interface UnreadCountBadgeProps {
  userId: string
  initialCount: number
}

export default function UnreadCountBadge({ userId, initialCount }: UnreadCountBadgeProps) {
  const [count, setCount] = useState(initialCount)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const refresh = async () => {
      const { count: total } = await getTotalUnreadCountEnhanced()
      setCount(total)
    }

    const channel = supabase
      .channel(`header-unread-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-ume-pink text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
      {count > 99 ? '99+' : count}
    </span>
  )
}
