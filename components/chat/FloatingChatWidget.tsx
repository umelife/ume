'use client'

/**
 * FloatingChatWidget Component
 *
 * A floating chat widget that appears on listing pages.
 * Features:
 * - Floating button with unread message indicator
 * - Expandable chat window
 * - Real-time messaging
 * - Mobile responsive
 * - Auto-marks messages as read when opened
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble from '@/components/chat/MessageBubble'
import { trackEvent } from '@/lib/mixpanel/client'

interface FloatingChatWidgetProps {
  listingId: string
  sellerId: string
  sellerName?: string
  listingTitle?: string
  currentUserId?: string | null
}

export default function FloatingChatWidget({
  listingId,
  sellerId,
  sellerName = 'Seller',
  listingTitle = 'Item',
  currentUserId: initialUserId
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId || null)
  const [messageText, setMessageText] = useState('')
  const [supabase] = useState(() => createClient())
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const previousMessageCountRef = useRef(0)

  // Get current user if not provided
  useEffect(() => {
    if (!initialUserId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUserId(user?.id || null)
      })
    }
  }, [supabase, initialUserId])

  // Don't show chat widget if:
  // - User is not logged in
  // - User is the seller (can't message yourself)
  const shouldShowWidget = currentUserId && currentUserId !== sellerId

  // Use messages hook with auto-mark-read disabled (we'll control it manually)
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    messagesEndRef
  } = useMessages(
    shouldShowWidget ? listingId : null,
    shouldShowWidget ? sellerId : null,
    {
      autoMarkRead: isOpen, // Only auto-mark when chat is open
      autoScroll: isOpen
    }
  )

  // Calculate unread messages
  useEffect(() => {
    if (!currentUserId) return

    const unread = messages.filter(
      m => m.receiver_id === currentUserId && !m.read
    ).length

    setUnreadCount(unread)

    // Detect new messages (for animation)
    if (messages.length > previousMessageCountRef.current && !isOpen) {
      setHasNewMessages(true)
      setTimeout(() => setHasNewMessages(false), 2000)
    }
    previousMessageCountRef.current = messages.length
  }, [messages, currentUserId, isOpen])

  // Mark as read when opening chat
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead()
    }
  }, [isOpen, unreadCount, markAsRead])

  // Handle send message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !currentUserId) return

    await sendMessage(messageText)
    setMessageText('')

    trackEvent('send_message_widget', {
      listing_id: listingId,
      message_length: messageText.length
    })
  }

  // Don't render if user shouldn't see widget
  if (!shouldShowWidget) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          trackEvent('toggle_chat_widget', { listing_id: listingId, open: !isOpen })
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50 flex items-center justify-center ${
          hasNewMessages ? 'animate-bounce' : ''
        }`}
        aria-label="Open chat"
      >
        {/* Chat Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-sm">{listingTitle}</h3>
              <p className="text-xs text-blue-100 truncate">Chat with {sellerName}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors ml-2"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-sm">Loading messages...</div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
                <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Start a conversation</p>
                <p className="text-xs mt-1">Send a message to the seller</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === currentUserId}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {sending ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
