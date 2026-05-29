'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import { trackEvent } from '@/lib/mixpanel/client'
import { reportConversation, deleteConversation } from '@/lib/chat/conversation-actions'
import { getCampusFromEmail, getSafePointsForCampus } from '@/data/safe-points'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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
  const [safeHandshakeLoading, setSafeHandshakeLoading] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinSession, setJoinSession] = useState<{ id: string; safe_point_id: string | null } | null>(null)
  // Custom meetup location state (for the "Different spot" section in proposals)
  const [showCustomSpot, setShowCustomSpot] = useState(false)
  const [customSpotText, setCustomSpotText] = useState('')
  const [customSpotLat, setCustomSpotLat] = useState<number | null>(null)
  const [customSpotLng, setCustomSpotLng] = useState<number | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
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
        setUserEmail(user.email ?? null)
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

  // ── Loading state ──
  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center bg-ume-bg" style={{ height: pageHeight }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ume-indigo border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (conversationsError) {
    return (
      <div className="flex items-center justify-center bg-ume-bg p-4" style={{ height: pageHeight }}>
        <div className="bg-white border border-border rounded-2xl p-6 max-w-md text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Error loading conversations: {conversationsError}</p>
        </div>
      </div>
    )
  }

  // ── Empty state ──
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center bg-ume-bg p-4" style={{ height: pageHeight }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ume-indigo mb-2">No messages yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Start a conversation by contacting a seller on a listing</p>
          <Button asChild className="rounded-full bg-ume-indigo hover:bg-indigo-800 text-white px-6">
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Conversation list JSX (inlined to avoid inner-component remount anti-pattern) ──
  const conversationListJSX = (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No conversations found</div>
      ) : (
        filteredConversations.map((conv) => {
          const isSelected = selectedConversation?.listingId === conv.listingId &&
                             selectedConversation?.otherUserId === conv.otherUserId
          const hasUnread = (conv.unreadCount ?? 0) > 0
          return (
            <button
              key={`${conv.listingId}-${conv.otherUserId}`}
              onClick={() => handleSelectConversation(conv)}
              className={cn(
                'w-full px-4 py-3 border-b border-border/60 flex items-center gap-3 text-left transition-colors hover:bg-muted/50',
                isSelected && 'bg-indigo-50 hover:bg-indigo-50'
              )}
            >
              {/* Avatar with unread badge */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-ume-indigo text-white text-sm font-semibold">
                    {getInitials(conv.otherUser?.display_name)}
                  </AvatarFallback>
                </Avatar>
                {hasUnread && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-red-500 border-white border-2 text-[10px] font-bold rounded-full">
                    {(conv.unreadCount ?? 0) > 9 ? '9+' : conv.unreadCount}
                  </Badge>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={cn('text-sm truncate', hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/80')}>
                    {conv.otherUser?.display_name || 'Unknown User'}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                </div>
                <p className={cn('text-xs truncate', hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {conv.lastMessage || 'No messages yet'}
                </p>
                {conv.listing?.title && (
                  <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{conv.listing.title}</p>
                )}
              </div>
            </button>
          )
        })
      )}
    </div>
  )

  // Safe points filtered to the current user's campus (auto-detected from .edu email)
  const campusSafePoints = getSafePointsForCampus(getCampusFromEmail(userEmail)?.id)

  // Unified 🤝 button handler — sends a proposal message with location options in chat
  async function handleSafeHandshakeClick() {
    if (!selectedConversation?.listingId || !currentUserId) return

    setSafeHandshakeLoading(true)
    try {
      // Check if an active session already exists
      const { data: active } = await supabase
        .from('safe_handshakes')
        .select('id, safe_point_id, status')
        .eq('listing_id', selectedConversation.listingId)
        .not('status', 'in', '(completed,cancelled)')
        .maybeSingle()

      if (active) {
        // Session already started — show join modal
        setJoinSession({ id: active.id, safe_point_id: active.safe_point_id })
        setShowJoinModal(true)
        return
      }

      // Check if a proposal is already pending in the chat
      const hasPendingProposal = messages.some((m) => m.body.includes('__HANDSHAKE_PROPOSAL__'))
      if (hasPendingProposal) {
        alert('A Safe-Handshake proposal is already in the chat — scroll up and click a location to confirm.')
        return
      }

      // Send a proposal message with embedded location options
      await sendMessage(
        `🤝 I'd like to do a Safe-Handshake meetup! Choose a location below to confirm the session:\n__HANDSHAKE_PROPOSAL__`
      )
    } finally {
      setSafeHandshakeLoading(false)
    }
  }

  // Called when either party clicks a location inside a proposal message.
  // Pass safePointId for predefined safe points, or customLocation for a custom spot.
  async function handleConfirmHandshakeLocation(
    safePointId: string | null,
    customLocation?: { text: string; lat: number; lng: number }
  ) {
    if (!selectedConversation?.listingId || !currentUserId) return
    const isSellerConfirming = selectedConversation.listing?.user_id === currentUserId
    setSafeHandshakeLoading(true)
    try {
      // If a session was already created (other party clicked first), just navigate
      const { data: existing } = await supabase
        .from('safe_handshakes')
        .select('id')
        .eq('listing_id', selectedConversation.listingId)
        .not('status', 'in', '(completed,cancelled)')
        .maybeSingle()

      if (existing) {
        router.push(`/safe-handshake/${existing.id}`)
        return
      }

      const body: Record<string, unknown> = { listingId: selectedConversation.listingId }
      if (safePointId) body.safePointId = safePointId
      if (customLocation) body.customLocation = customLocation
      if (isSellerConfirming) body.buyerId = selectedConversation.otherUserId

      const res = await fetch('/api/safe-handshake/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const locationName = safePointId
        ? (campusSafePoints.find((p) => p.id === safePointId)?.name ?? 'Safe-Point')
        : customLocation?.text ?? 'Custom location'
      await sendMessage(`📍 Location confirmed: ${locationName}! Opening the Safe-Handshake session now.`)

      // Reset custom spot state
      setShowCustomSpot(false)
      setCustomSpotText('')
      setCustomSpotLat(null)
      setCustomSpotLng(null)

      router.push(`/safe-handshake/${data.id}`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not start Safe-Handshake')
    } finally {
      setSafeHandshakeLoading(false)
    }
  }

  // Get the user's current GPS position and store it for the custom spot
  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomSpotLat(pos.coords.latitude)
        setCustomSpotLng(pos.coords.longitude)
        setGettingLocation(false)
      },
      () => {
        alert('Could not get your location. Please allow location access and try again.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Chat header JSX ──
  const chatHeaderJSX = selectedConversation ? (
    <div className="px-4 py-3 border-b border-border bg-white flex items-center gap-3 flex-shrink-0 shadow-sm">
      {/* Mobile back button */}
      <button
        onClick={handleBackToConversations}
        className="md:hidden p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Back"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className="bg-ume-indigo text-white text-xs font-semibold">
          {getInitials(selectedConversation.otherUser?.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight truncate">
          {selectedConversation.otherUser?.display_name || 'Unknown User'}
        </p>
        {selectedConversation.listing?.title && (
          <p className="text-xs text-muted-foreground truncate leading-tight">{selectedConversation.listing.title}</p>
        )}
      </div>

      {/* Safe-Handshake button */}
      <Button
        onClick={handleSafeHandshakeClick}
        disabled={safeHandshakeLoading}
        size="sm"
        className="rounded-full bg-ume-indigo hover:bg-indigo-800 text-white text-xs font-semibold flex-shrink-0 gap-1.5 px-3"
        title="Safe-Handshake — secure GPS-verified meetup at a campus Safe-Point"
      >
        {safeHandshakeLoading ? (
          <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <span>🤝</span>
        )}
        <span className="hidden sm:inline">Safe-Handshake</span>
      </Button>

      {/* Options menu */}
      <div className="relative">
        <button
          onClick={() => setShowInfoDropdown(!showInfoDropdown)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Chat options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {showInfoDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowInfoDropdown(false)} />
            <div className="absolute right-0 top-10 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <Link
                href={`/item/${selectedConversation.listingId}`}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors block"
                onClick={() => setShowInfoDropdown(false)}
              >
                View Listing
              </Link>
              <button onClick={handleReportChat} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors">
                Report Chat
              </button>
              <button onClick={handleDeleteChat} className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-muted transition-colors">
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
      className="flex-1 overflow-y-auto bg-ume-bg min-h-0 px-3 py-4 md:px-6 md:py-6"
    >
      {messagesLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ume-indigo border-t-transparent" />
        </div>
      ) : messagesError ? (
        <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Error: {messagesError}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No messages yet — say hello!</p>
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
                className={cn('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
                onMouseEnter={() => isOwn && setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                onTouchStart={() => isOwn && setHoveredMessageId(message.id)}
              >
                {/* Other user avatar */}
                {!isOwn && (
                  <Avatar className="h-6 w-6 flex-shrink-0 mb-0.5" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                    <AvatarFallback className="bg-ume-indigo text-white text-[10px] font-semibold">
                      {getInitials(selectedConversation?.otherUser?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex items-center gap-1.5">
                  {/* Message options menu (own messages on hover) */}
                  {isOwn && hoveredMessageId === message.id && !isEditing && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Message options"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                        </svg>
                      </button>
                      {showMessageMenu === message.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowMessageMenu(null)} />
                          <div className="absolute right-0 top-6 w-28 bg-white border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            <button
                              onClick={() => handleStartEdit(message)}
                              disabled={!canEdit}
                              className={cn(
                                'w-full px-3 py-2 text-left text-xs transition-colors',
                                canEdit ? 'text-foreground hover:bg-muted' : 'text-muted-foreground cursor-not-allowed'
                              )}
                              title={!canEdit ? 'Cannot edit after message is viewed' : ''}
                            >Edit</button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={!canEdit}
                              className={cn(
                                'w-full px-3 py-2 text-left text-xs transition-colors',
                                canEdit ? 'text-destructive hover:bg-muted' : 'text-muted-foreground cursor-not-allowed'
                              )}
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
                        <Input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="rounded-2xl bg-white border-border text-sm focus-visible:ring-ume-indigo/30 text-foreground"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="rounded-full text-xs h-7 px-3"
                          >Cancel</Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(message.id)}
                            className="rounded-full text-xs h-7 px-3 bg-ume-indigo hover:bg-indigo-800 text-white"
                          >Save</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words max-w-[260px] md:max-w-[400px]',
                            isOwn
                              ? 'bg-ume-indigo text-white rounded-br-sm shadow-sm'
                              : 'bg-white text-foreground rounded-bl-sm shadow-sm border border-border/50'
                          )}
                          style={{ wordBreak: 'break-word' }}
                        >
                          {message.body.includes('__HANDSHAKE_PROPOSAL__') ? (
                            <>
                              <p className="mb-3">{message.body.replace('\n__HANDSHAKE_PROPOSAL__', '').replace('__HANDSHAKE_PROPOSAL__', '')}</p>
                              <div className={cn('flex flex-col gap-1.5 pt-2 border-t', isOwn ? 'border-white/20' : 'border-border/60')}>
                                <p className={cn('text-[11px] font-semibold uppercase tracking-wide mb-0.5', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
                                  Pick a location
                                </p>
                                {campusSafePoints.map((point) => (
                                  <button
                                    key={point.id}
                                    onClick={() => handleConfirmHandshakeLocation(point.id)}
                                    disabled={safeHandshakeLoading}
                                    className={cn(
                                      'text-xs rounded-xl px-3 py-2 text-left transition-colors font-medium flex items-center gap-2 disabled:opacity-50',
                                      isOwn
                                        ? 'bg-white/20 hover:bg-white/30 text-white'
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-ume-indigo border border-indigo-200'
                                    )}
                                  >
                                    <span>📍</span>
                                    <span>{point.name}</span>
                                  </button>
                                ))}

                                {/* Different spot toggle */}
                                <button
                                  onClick={() => setShowCustomSpot((v) => !v)}
                                  className={cn(
                                    'text-xs rounded-xl px-3 py-2 text-left transition-colors font-medium flex items-center gap-2',
                                    isOwn
                                      ? 'bg-white/10 hover:bg-white/20 text-white/80'
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground border border-border'
                                  )}
                                >
                                  <span>🗺️</span>
                                  <span>Different spot…</span>
                                  <svg className={cn('w-3 h-3 ml-auto transition-transform', showCustomSpot && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {showCustomSpot && (
                                  <div className={cn('rounded-xl p-3 space-y-2', isOwn ? 'bg-white/10' : 'bg-muted/60 border border-border')}>
                                    <p className={cn('text-[10px] font-semibold uppercase tracking-wide', isOwn ? 'text-white/60' : 'text-amber-600')}>
                                      ⚠️ Not a verified safe point — meet somewhere public
                                    </p>
                                    <input
                                      type="text"
                                      value={customSpotText}
                                      onChange={(e) => setCustomSpotText(e.target.value)}
                                      placeholder="e.g. Library main entrance"
                                      className="w-full px-3 py-2 rounded-lg text-xs text-foreground bg-white border border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ume-indigo/30"
                                      maxLength={80}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation}
                                        className="flex-1 text-xs py-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                      >
                                        {gettingLocation ? (
                                          <span className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <span>📡</span>
                                        )}
                                        {customSpotLat ? 'Location captured ✓' : 'Use my location'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!customSpotText.trim()) { alert('Enter a location name first.'); return }
                                          if (!customSpotLat || !customSpotLng) { alert('Capture your location first so GPS verification works.'); return }
                                          handleConfirmHandshakeLocation(null, { text: customSpotText.trim(), lat: customSpotLat, lng: customSpotLng })
                                        }}
                                        disabled={safeHandshakeLoading || !customSpotText.trim() || !customSpotLat}
                                        className="flex-1 text-xs py-1.5 rounded-lg bg-ume-indigo text-white font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-40"
                                      >
                                        Confirm spot
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            message.body
                          )}
                        </div>
                        {message.edited && <span className="text-[10px] text-muted-foreground px-1">Edited</span>}
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

  // Contextual hint above the message input
  const handshakeHintJSX = selectedConversation ? (
    <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2 flex-shrink-0">
      <span className="text-base">🤝</span>
      <p className="text-xs text-indigo-700 leading-snug">
        Press <strong>Safe-Handshake</strong> above to send a meetup proposal in chat — discuss and click a location to confirm.
      </p>
    </div>
  ) : null

  // Join confirmation modal — shown when a session already exists
  const joinModalJSX = showJoinModal && joinSession ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowJoinModal(false)}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Join Safe-Handshake</h2>
          <button onClick={() => setShowJoinModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {joinSession.safe_point_id && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <svg className="w-4 h-4 text-ume-indigo flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-[11px] text-indigo-500 font-medium uppercase tracking-wide">Meeting at</p>
              <p className="text-sm font-bold text-ume-indigo">
                {campusSafePoints.find((p) => p.id === joinSession.safe_point_id)?.name ?? joinSession.safe_point_id}
              </p>
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-5">
          A Safe-Handshake session is ready. Tap below to open it and head to the agreed Safe-Point.
        </p>
        <Button
          onClick={() => { setShowJoinModal(false); router.push(`/safe-handshake/${joinSession.id}`) }}
          className="w-full rounded-full bg-ume-indigo hover:bg-indigo-800 text-white font-semibold"
        >
          Open Session
        </Button>
      </div>
    </div>
  ) : null

  return (
    <div className="flex bg-white overflow-hidden" style={{ height: pageHeight }}>
      {joinModalJSX}

      {/* ── Mobile ─────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden w-full flex-col">
        {!showMobileConversationView ? (
          /* Conversation list */
          <div className="flex flex-col h-full bg-white">
            <div className="px-4 py-4 border-b border-border flex-shrink-0">
              <h1 className="text-xl font-bold text-ume-indigo mb-3">Messages</h1>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-muted rounded-full text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            {conversationListJSX}
          </div>
        ) : (
          /* Active chat */
          <div className="flex flex-col h-full">
            {chatHeaderJSX}
            {messagesListJSX}
            {handshakeHintJSX}
            <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
          </div>
        )}
      </div>

      {/* ── Desktop two-panel layout ─────────────────────────────────────── */}
      <div className="hidden md:flex w-full h-full">
        {/* Left sidebar — conversation list */}
        <div className="w-80 border-r border-border flex flex-col bg-white h-full flex-shrink-0">
          <div className="px-5 py-4 border-b border-border flex-shrink-0">
            <h1 className="text-xl font-bold text-ume-indigo mb-3">Messages</h1>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-muted rounded-full text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          {conversationListJSX}
        </div>

        {/* Right panel — active chat */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {selectedConversation ? (
            <>
              {chatHeaderJSX}
              {messagesListJSX}
              {handshakeHintJSX}
              <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex-1 flex items-center justify-center bg-ume-bg">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
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
  const [text, setText] = useState(initialText)
  const [suggestion, setSuggestion] = useState('')

  useEffect(() => {
    if (initialText) setText(initialText)
  }, [initialText])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(e, text)
    setText('')
    setSuggestion('')
  }

  return (
    <div className="bg-white border-t border-border flex-shrink-0">
      <form onSubmit={handleSubmit} className="px-3 py-3 flex items-center gap-2">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-full bg-muted border-transparent text-sm focus-visible:ring-ume-indigo/30 focus-visible:border-ume-indigo/30 text-foreground placeholder:text-muted-foreground h-10"
          disabled={disabled}
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={cn(
            'p-2 rounded-full flex-shrink-0 transition-colors',
            text.trim() && !disabled
              ? 'text-ume-indigo hover:bg-indigo-50'
              : 'text-muted-foreground cursor-not-allowed'
          )}
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
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ume-indigo border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
