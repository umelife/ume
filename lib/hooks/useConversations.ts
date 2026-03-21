/**
 * useConversations Hook
 *
 * Manages conversations list with real-time updates.
 * Features:
 * - Fetches conversations with unread counts
 * - Subscribes to postgres_changes events on conversations table
 * - Subscribes to messages table to detect new conversations
 * - Updates local state immutably on INSERT/UPDATE/DELETE
 * - Automatic cleanup on unmount
 *
 * Usage:
 * const { conversations, loading, error, refetch } = useConversations()
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConversationsEnhanced } from '@/lib/chat/enhanced-actions'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Conversation {
  id: string
  listingId: string
  listing: any
  otherUserId: string
  otherUser: any
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  updatedAt: string
}

interface UseConversationsReturn {
  conversations: Conversation[]
  loading: boolean
  error: string | null
  totalUnreadCount: number
  refetch: () => Promise<void>
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const channelsRef = useRef<RealtimeChannel[]>([])
  const mountedRef = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch conversations from server
  const fetchConversations = useCallback(async () => {
    try {
      setError(null)
      const result = await getConversationsEnhanced()

      if (!mountedRef.current) return

      if (result.error) {
        setError(result.error)
        setConversations([])
      } else {
        setConversations(result.conversations)
      }
    } catch (err: any) {
      if (!mountedRef.current) return
      console.error('Error fetching conversations:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      // Always clear loading — safe even if unmounted (React 18 no-ops state on unmounted components)
      setLoading(false)
    }
  }, [])

  // Debounced version to coalesce rapid real-time events
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (mountedRef.current) fetchConversations()
    }, 300)
  }, [fetchConversations])

  // Subscribe to real-time changes
  useEffect(() => {
    mountedRef.current = true

    // Initial fetch
    fetchConversations()

    // Subscribe to conversations table changes
    const conversationsChannel = supabase
      .channel('realtime:conversations')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations'
        },
        () => {
          // Refetch to get updated data with joins
          debouncedFetch()
        }
      )
      .subscribe()

    channelsRef.current.push(conversationsChannel)

    // Also subscribe to messages table to detect new conversations and deletions
    const messagesChannel = supabase
      .channel('realtime:messages-for-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          debouncedFetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        () => {
          debouncedFetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        () => {
          debouncedFetch()
        }
      )
      .subscribe()

    channelsRef.current.push(messagesChannel)

    // Cleanup on unmount
    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)

      // Unsubscribe from all channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [supabase, fetchConversations, debouncedFetch])

  // Compute total unread count across all conversations
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  return {
    conversations,
    loading,
    error,
    totalUnreadCount,
    refetch: fetchConversations
  }
}
