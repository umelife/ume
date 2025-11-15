'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble from '@/components/chat/MessageBubble'
import { trackEvent } from '@/lib/mixpanel/client'
import Navbar from '@/components/layout/Navbar'

export default function MessagesPage() {
  const [supabase] = useState(() => createClient())
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [fadingBadges, setFadingBadges] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Enhanced hooks
  const { conversations, loading: conversationsLoading, error: conversationsError } = useConversations()

  const {
    messages,
    loading: messagesLoading,
    sending,
    error: messagesError,
    sendMessage,
    editMessage,
    deleteMessage,
    messagesEndRef
  } = useMessages(
    selectedConversation?.listingId || null,
    selectedConversation?.otherUserId || null,
    {
      autoMarkRead: true,
      autoScroll: true
    }
  )

  // Get current user
  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (mounted) {
        setCurrentUserId(user.id)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  // Handle message send
  async function handleSendMessage(e: React.FormEvent, messageText: string) {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation || !currentUserId) return

    await sendMessage(messageText)

    trackEvent('send_message', {
      listing_id: selectedConversation.listingId,
      message_length: messageText.length,
    })
  }

  // Handle conversation selection
  function handleSelectConversation(conversation: Conversation) {
    // If the conversation has unread messages, trigger fade-out animation
    if (conversation.unreadCount > 0) {
      const key = `${conversation.listingId}-${conversation.otherUserId}`
      setFadingBadges(prev => new Set(prev).add(key))

      // Remove from fading set after animation completes
      setTimeout(() => {
        setFadingBadges(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 300) // Match animation duration
    }

    setSelectedConversation(conversation)
  }

  // Handle message edit
  async function handleEditMessage(messageId: string, newBody: string): Promise<boolean> {
    const success = await editMessage(messageId, newBody)

    if (success) {
      trackEvent('edit_message', { message_id: messageId })
    }

    return success
  }

  // Handle message delete
  async function handleDeleteMessage(messageId: string): Promise<boolean> {
    const success = await deleteMessage(messageId)

    if (success) {
      trackEvent('delete_message', { message_id: messageId })
    }

    return success
  }

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-black">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading conversations: {conversationsError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-black mb-4">No messages yet</p>
            <Link href="/marketplace" className="text-blue-600 hover:text-blue-700 underline">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-black">Conversations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={`${conversation.listingId}-${conversation.otherUserId}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className={
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors ' +
                      (selectedConversation?.listingId === conversation.listingId &&
                      selectedConversation?.otherUserId === conversation.otherUserId
                        ? 'bg-blue-50'
                        : '')
                    }
                  >
                    <div className="flex items-start gap-3">
                      {conversation.listing?.image_urls?.[0] && (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-black text-sm truncate">
                            {conversation.listing?.title || 'Unknown Listing'}
                          </p>
                          {(conversation.unreadCount > 0 || fadingBadges.has(`${conversation.listingId}-${conversation.otherUserId}`)) && (
                            <span className={
                              'flex-shrink-0 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 ' +
                              (fadingBadges.has(`${conversation.listingId}-${conversation.otherUserId}`) ? 'animate-fade-out' : 'animate-fade-in')
                            }>
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black mb-1">
                          {conversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-black truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-black mt-1">
                          {new Date(conversation.lastMessageTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages View */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-black">
                          {selectedConversation.listing?.title || 'Unknown Listing'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          with {selectedConversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                      </div>
                      <Link
                        href={`/item/${selectedConversation.listingId}`}
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                      >
                        View Listing
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <p className="text-center text-gray-500">Loading messages...</p>
                    ) : messagesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">Error: {messagesError}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-gray-500">No messages yet</p>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwnMessage={message.sender_id === currentUserId}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                          />
                        ))}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={sending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Message Input Component
function MessageInput({
  onSend,
  disabled
}: {
  onSend: (e: React.FormEvent, text: string) => void
  disabled: boolean
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    onSend(e, text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
