'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import { trackEvent } from '@/lib/mixpanel/client'
import { reportConversation, deleteConversation } from '@/lib/chat/conversation-actions'

function formatTime(dateString: string | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function MessagesPageContent() {
  const [supabase] = useState(() => createClient())
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileConversationView, setShowMobileConversationView] = useState(false)
  const [prefillText, setPrefillText] = useState<string>('')
  const [showInfoDropdown, setShowInfoDropdown] = useState(false)
  const [pageHeight, setPageHeight] = useState('100dvh')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

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
    { autoMarkRead: true, autoScroll: false }
  )

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const prevMessagesCount = useRef<number>(0)

  // Measure header + footer heights so messages container fills exactly the space between them.
  // Hidden elements have offsetHeight = 0, so we safely sum all header/footer tags.
  useEffect(() => {
    function measure() {
      const headers = document.querySelectorAll('header')
      const footers = document.querySelectorAll('footer')
      const headerH = Array.from(headers).reduce((s, el) => s + el.offsetHeight, 0)
      const footerH = Array.from(footers).reduce((s, el) => s + el.offsetHeight, 0)
      setPageHeight(`calc(100dvh - ${headerH}px - ${footerH}px)`)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    let mounted = true
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (mounted) {
        setCurrentUserId(user.id)
        const prefillParam = searchParams.get('prefill')
        if (prefillParam) {
          try { setPrefillText(decodeURIComponent(prefillParam)) } catch {}
        }
      }
    }
    init()
    return () => { mounted = false }
  }, [supabase, router, searchParams])

  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId')
    if (conversationIdParam && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(conv => conv.id === conversationIdParam)
      if (conversation) {
        setSelectedConversation(conversation)
        setShowMobileConversationView(true)
      }
    }
  }, [searchParams, conversations, selectedConversation])

  // Reset message count when conversation changes so the load-scroll fires
  useEffect(() => {
    prevMessagesCount.current = 0
  }, [selectedConversation?.id])

  // Scroll to bottom when messages first load for a conversation, or when user sends a message
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || messages.length === 0) {
      prevMessagesCount.current = messages.length
      return
    }
    const prevCount = prevMessagesCount.current
    const newCount = messages.length

    if (prevCount === 0 && newCount > 0) {
      // Initial load — jump straight to latest messages (no animation)
      container.scrollTop = container.scrollHeight
    } else if (newCount > prevCount) {
      // New message added — only auto-scroll if it's the current user's message
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.sender_id === currentUserId) {
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 50)
      }
    }
    prevMessagesCount.current = newCount
  }, [messages, currentUserId])

  async function handleSendMessage(e: React.FormEvent, messageText: string) {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation || !currentUserId) return
    await sendMessage(messageText)
    trackEvent('send_message', { listing_id: selectedConversation.listingId, message_length: messageText.length })
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversation(conversation)
    setShowMobileConversationView(true)
  }

  function handleBackToConversations() {
    setShowMobileConversationView(false)
    setSelectedConversation(null)
  }

  async function handleEditMessage(messageId: string, newBody: string): Promise<boolean> {
    const success = await editMessage(messageId, newBody)
    if (success) trackEvent('edit_message', { message_id: messageId })
    return success
  }

  async function handleDeleteMessage(messageId: string): Promise<boolean> {
    const success = await deleteMessage(messageId)
    if (success) trackEvent('delete_message', { message_id: messageId })
    setShowMessageMenu(null)
    return success
  }

  async function handleReportChat() {
    if (!selectedConversation) return
    const reason = prompt('Please provide a reason for reporting this chat:')
    if (!reason || !reason.trim()) return
    const result = await reportConversation(selectedConversation.listingId, selectedConversation.otherUserId, reason)
    if (result.error) { alert('Failed to report chat: ' + result.error) }
    else { alert('Chat reported successfully. Our team will review it.'); trackEvent('report_chat', { listing_id: selectedConversation.listingId }) }
    setShowInfoDropdown(false)
  }

  async function handleDeleteChat() {
    if (!selectedConversation) return
    const confirmed = confirm('Are you sure you want to delete this chat? This will permanently delete all messages in this conversation.')
    if (!confirmed) return
    const result = await deleteConversation(selectedConversation.listingId, selectedConversation.otherUserId)
    if (result.error) { alert('Failed to delete chat: ' + result.error) }
    else {
      trackEvent('delete_chat', { listing_id: selectedConversation.listingId })
      setShowInfoDropdown(false)
      setSelectedConversation(null)
      setShowMobileConversationView(false)
    }
  }

  function handleStartEdit(message: any) {
    setEditingMessageId(message.id)
    setEditingText(message.body)
    setShowMessageMenu(null)
  }

  function handleCancelEdit() { setEditingMessageId(null); setEditingText('') }

  async function handleSaveEdit(messageId: string) {
    const success = await handleEditMessage(messageId, editingText)
    if (success) { setEditingMessageId(null); setEditingText('') }
  }

  function canEditOrDelete(message: any): boolean { return message.seen_at === null }

  const filteredConversations = conversations.filter(conv =>
    conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center bg-ume-bg" style={{ height: pageHeight }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ume-indigo border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (conversationsError) {
    return (
      <div className="flex items-center justify-center bg-ume-bg p-4" style={{ height: pageHeight }}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md text-center shadow-sm">
          <p className="text-gray-600 text-sm">Error loading conversations: {conversationsError}</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center bg-ume-bg p-4" style={{ height: pageHeight }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ume-indigo mb-2">No messages yet</h2>
          <p className="text-gray-500 text-sm mb-6">Start a conversation by contacting a seller on a listing</p>
          <Link href="/marketplace" className="inline-block bg-ume-indigo text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </div>
    )
  }

  // ── Conversation list JSX (inlined to avoid inner-component remount anti-pattern) ──
  const conversationListJSX = (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">No conversations found</div>
      ) : (
        filteredConversations.map((conv) => {
          const isSelected = selectedConversation?.listingId === conv.listingId &&
                             selectedConversation?.otherUserId === conv.otherUserId
          const hasUnread = (conv.unreadCount ?? 0) > 0
          return (
            <button
              key={`${conv.listingId}-${conv.otherUserId}`}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-ume-indigo text-white flex items-center justify-center font-semibold text-base">
                  {getInitials(conv.otherUser?.display_name)}
                </div>
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {(conv.unreadCount ?? 0) > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm truncate ${hasUnread ? 'font-bold text-black' : 'font-semibold text-gray-800'}`}>
                    {conv.otherUser?.display_name || 'Unknown User'}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                </div>
                <p className={`text-xs truncate ${hasUnread ? 'text-black font-medium' : 'text-gray-500'}`}>
                  {conv.lastMessage || 'No messages yet'}
                </p>
                {conv.listing?.title && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{conv.listing.title}</p>
                )}
              </div>
            </button>
          )
        })
      )}
    </div>
  )

  // ── Chat header JSX ──
  const chatHeaderJSX = selectedConversation ? (
    <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0 shadow-sm">
      {/* Mobile back button */}
      <button
        onClick={handleBackToConversations}
        className="md:hidden p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Back"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="w-9 h-9 rounded-full bg-ume-indigo text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
        {getInitials(selectedConversation.otherUser?.display_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black text-sm leading-tight">
          {selectedConversation.otherUser?.display_name || 'Unknown User'}
        </p>
        {selectedConversation.listing?.title && (
          <p className="text-xs text-gray-500 truncate leading-tight">{selectedConversation.listing.title}</p>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowInfoDropdown(!showInfoDropdown)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Chat options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {showInfoDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowInfoDropdown(false)} />
            <div className="absolute right-0 top-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <Link
                href={`/item/${selectedConversation.listingId}`}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                onClick={() => setShowInfoDropdown(false)}
              >
                View Listing
              </Link>
              <button onClick={handleReportChat} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Report Chat
              </button>
              <button onClick={handleDeleteChat} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-gray-50 transition-colors">
                Delete Chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null

  // ── Messages list JSX (inlined — NOT a sub-component, to preserve scroll position across re-renders) ──
  const messagesListJSX = (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 min-h-0 px-3 py-4 md:px-6 md:py-6"
    >
      {messagesLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ume-indigo border-t-transparent"></div>
        </div>
      ) : messagesError ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">Error: {messagesError}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">No messages yet — say hello!</p>
        </div>
      ) : (
        <div className="space-y-1 md:max-w-3xl md:mx-auto">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === currentUserId
            const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
            const isEditing = editingMessageId === message.id
            const canEdit = isOwn && canEditOrDelete(message)

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                onMouseEnter={() => isOwn && setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                onTouchStart={() => isOwn && setHoveredMessageId(message.id)}
              >
                {!isOwn && (
                  <div
                    className="w-6 h-6 rounded-full bg-ume-indigo text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mb-0.5"
                    style={{ visibility: showAvatar ? 'visible' : 'hidden' }}
                  >
                    {getInitials(selectedConversation?.otherUser?.display_name)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {isOwn && hoveredMessageId === message.id && !isEditing && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 active:text-black transition-colors"
                        aria-label="Message options"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                        </svg>
                      </button>
                      {showMessageMenu === message.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowMessageMenu(null)} />
                          <div className="absolute right-0 top-6 w-28 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            <button
                              onClick={() => handleStartEdit(message)}
                              disabled={!canEdit}
                              className={`w-full px-3 py-2 text-left text-xs transition-colors ${canEdit ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
                              title={!canEdit ? 'Cannot edit after message is viewed' : ''}
                            >Edit</button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={!canEdit}
                              className={`w-full px-3 py-2 text-left text-xs transition-colors ${canEdit ? 'text-red-500 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
                              title={!canEdit ? 'Cannot delete after message is viewed' : ''}
                            >Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 max-w-[280px]">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo text-black"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors">Cancel</button>
                          <button onClick={() => handleSaveEdit(message.id)} className="px-3 py-1.5 bg-ume-indigo text-white text-xs rounded-full hover:bg-indigo-800 transition-colors">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words max-w-[260px] md:max-w-[400px] ${
                            isOwn ? 'bg-ume-indigo text-white rounded-br-sm' : 'bg-white text-black rounded-bl-sm shadow-sm'
                          }`}
                          style={{ wordBreak: 'break-word' }}
                        >
                          {message.body}
                        </div>
                        {message.edited && <span className="text-[10px] text-gray-400 px-1">Edited</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )

  return (
    <div className="flex bg-white overflow-hidden" style={{ height: pageHeight }}>

      {/* ── Mobile ─────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden w-full flex-col">
        {!showMobileConversationView ? (
          <div className="flex flex-col h-full bg-white">
            <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h1 className="text-xl font-bold text-ume-indigo mb-3">Messages</h1>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none text-black placeholder-gray-400"
                />
              </div>
            </div>
            {conversationListJSX}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {chatHeaderJSX}
            {messagesListJSX}
            <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
          </div>
        )}
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white h-full flex-shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h1 className="text-xl font-bold text-ume-indigo mb-3">Messages</h1>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none text-black placeholder-gray-400"
              />
            </div>
          </div>
          {conversationListJSX}
        </div>

        <div className="flex-1 flex flex-col h-full min-w-0">
          {selectedConversation ? (
            <>
              {chatHeaderJSX}
              {messagesListJSX}
              <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageInput({
  onSend,
  disabled,
  initialText = ''
}: {
  onSend: (e: React.FormEvent, text: string) => void
  disabled: boolean
  initialText?: string
}) {
  const [text, setText] = useState('')
  const [suggestion, setSuggestion] = useState(initialText)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (initialText) setSuggestion(initialText)
  }, [initialText])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(e, text)
    setText('')
    setSuggestion('')
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    alert('Image sharing is coming soon!')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-white border-t border-gray-100 flex-shrink-0">
      {suggestion && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] text-gray-400 mb-1">Suggested message</p>
          <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            &ldquo;{suggestion}&rdquo;
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="px-3 py-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo/30 text-black placeholder-gray-400 transition"
          disabled={disabled}
          aria-label="Message input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0 transition-colors"
          aria-label="Add image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" aria-label="Upload image" />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`p-2 rounded-full flex-shrink-0 transition-colors ${text.trim() && !disabled ? 'text-ume-indigo hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'}`}
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center bg-ume-bg" style={{ height: '100dvh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ume-indigo border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
