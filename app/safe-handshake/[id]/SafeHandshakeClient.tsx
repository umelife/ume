'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getNearestSafePoint } from '@/lib/haversine'
import { SAFE_POINTS, getSafePointsForCampus } from '@/data/safe-points'
import StepBar from '@/components/safe-handshake/StepBar'
import QRDisplay from '@/components/safe-handshake/QRDisplay'
import QRScanner from '@/components/safe-handshake/QRScanner'
import type { SafeHandshake } from '@/types/database'
import { deleteListing } from '@/lib/listings/actions'

// Leaflet must be loaded client-side only
const SafeHandshakeMap = dynamic(
  () => import('@/components/safe-handshake/SafeHandshakeMap'),
  { ssr: false, loading: () => <div className="w-full h-[260px] bg-gray-100 rounded-xl animate-pulse" /> }
)

interface Props {
  handshake: SafeHandshake
  currentUserId: string
  listingTitle: string
  sellerName: string
  buyerName: string
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function statusToStep(status: string): 1 | 2 | 3 | 4 | 5 {
  switch (status) {
    case 'initiated': return 1
    case 'in_progress': return 2
    case 'seller_arrived':
    case 'buyer_arrived': return 3
    case 'both_arrived': return 3
    case 'qr_generated': return 4
    case 'completed': return 5
    default: return 1
  }
}

export default function SafeHandshakeClient({
  handshake: initialHandshake,
  currentUserId,
  listingTitle,
  sellerName,
  buyerName,
}: Props) {
  const [supabase] = useState(() => createClient())
  const [handshake, setHandshake] = useState<SafeHandshake>(initialHandshake)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLon, setUserLon] = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  // Initialise from DB so a page reload doesn't reset the arrived state
  const [hasArrived, setHasArrived] = useState(() =>
    currentUserId === initialHandshake.seller_id
      ? !!initialHandshake.seller_arrived_at
      : !!initialHandshake.buyer_arrived_at
  )
  const [isHeading, setIsHeading] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const watchIdRef = useRef<number | null>(null)

  const isSeller = currentUserId === handshake.seller_id
  const isBuyer = currentUserId === handshake.buyer_id
  const partnerName = isSeller ? buyerName : sellerName

  // Derive campus-specific safe points from the agreed location's campusId.
  // Falls back to all safe points if no location has been agreed yet.
  const campusSafePoints = getSafePointsForCampus(
    SAFE_POINTS.find((p) => p.id === handshake.safe_point_id)?.campusId
  )

  // Countdown timer
  useEffect(() => {
    const calc = () => {
      const secs = Math.max(0, Math.floor((new Date(handshake.expires_at).getTime() - Date.now()) / 1000))
      setCountdown(secs)
      return secs
    }
    calc()
    const t = setInterval(() => {
      const remaining = calc()
      if (remaining <= 0) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [handshake.expires_at])

  // Supabase Realtime — listen for status updates
  useEffect(() => {
    const channel = supabase
      .channel(`safe_handshake:${handshake.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'safe_handshakes',
          filter: `id=eq.${handshake.id}`,
        },
        (payload) => {
          setHandshake(payload.new as SafeHandshake)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, handshake.id])

  // Polling fallback — re-fetches every 3s so the UI stays in sync even if
  // the Realtime WebSocket is slow or unavailable (e.g. on localhost).
  // Stops automatically once the session reaches a terminal state.
  useEffect(() => {
    if (handshake.status === 'completed' || handshake.status === 'cancelled') return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('safe_handshakes')
        .select('*')
        .eq('id', handshake.id)
        .single()
      if (data) setHandshake(data as SafeHandshake)
    }, 3000)

    return () => clearInterval(interval)
  }, [supabase, handshake.id, handshake.status])

  // GPS watch — starts when user taps "Heading to Safe-Point"
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS is not available on this device')
      return
    }
    setGpsError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLat(latitude)
        setUserLon(longitude)

        // Check if within a campus safe point
        const nearest = getNearestSafePoint(latitude, longitude, campusSafePoints)
        if (nearest && !hasArrived) {
          setHasArrived(true)
          // Notify the server
          fetch(`/api/safe-handshake/${handshake.id}/arrive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ safePointId: nearest.point.id }),
          }).catch(console.error)
        }
      },
      (err) => {
        const msg = err.code === 1
          ? 'Location permission denied. Allow location access in your browser settings, or use the manual selector below.'
          : err.code === 2
          ? 'Your location could not be determined. Use the manual selector below to simulate arrival.'
          : 'Location request timed out. Use the manual selector below to simulate arrival.'
        setGpsError(msg)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
  }, [handshake.id, hasArrived])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  async function handleHeadingToSafePoint() {
    setIsHeading(true)
    startGPS()
    // GPS will call /arrive once the user physically enters a Safe-Point radius.
    // Nothing is sent to the server here — status stays 'initiated' until GPS fires.
  }

  async function simulateArrival(safePointId: string) {
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/safe-handshake/${handshake.id}/arrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safePointId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHasArrived(true)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to record arrival')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleGenerateQR() {
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/safe-handshake/${handshake.id}/generate-qr`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQrToken(data.token)
      setQrExpiresAt(data.expiresAt)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleScanQR(token: string) {
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/safe-handshake/${handshake.id}/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Success — Realtime will update the handshake state
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'QR scan failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteListing() {
    setDeleteLoading(true)
    await deleteListing(handshake.listing_id)
    // deleteListing redirects to /marketplace on success; only reaches here on error
    setDeleteLoading(false)
  }

  async function handleCancelSession() {
    setCancelLoading(true)
    try {
      const res = await fetch(`/api/safe-handshake/${handshake.id}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Realtime/polling will update handshake.status → 'cancelled'
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel session')
    } finally {
      setCancelLoading(false)
      setShowCancelConfirm(false)
    }
  }

  // Determine the active safe point for the map
  const myArrived = isSeller ? handshake.seller_arrived_at : handshake.buyer_arrived_at
  const myActiveSafePointId = myArrived ? handshake.safe_point_id ?? null : null
  const partnerArrived = isSeller ? handshake.buyer_arrived_at : handshake.seller_arrived_at
  const partnerActiveSafePointId = partnerArrived ? handshake.safe_point_id ?? null : null

  // ── COMPLETED SCREEN ────────────────────────────────────────────────────────
  if (handshake.status === 'completed') {
    return (
      <div className="min-h-screen bg-ume-cream flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-ume-indigo flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ume-indigo mb-2">Safe-Handshake Complete!</h1>
        <p className="text-gray-600 mb-1">Transaction verified at a campus Safe-Point.</p>
        <p className="text-gray-500 text-sm mb-8">
          <strong>&ldquo;{listingTitle}&rdquo;</strong> has been marked as sold.
        </p>

        {/* Seller: prompt to delete the listing */}
        {isSeller ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 w-full max-w-xs text-left">
            <p className="text-sm font-semibold text-gray-800 mb-1">Remove this listing?</p>
            <p className="text-xs text-gray-500 mb-4">
              Since it&apos;s sold, you can remove it from the marketplace so other buyers don&apos;t see it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteListing}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-ume-indigo text-white rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete it'}
              </button>
              <Link
                href="/marketplace"
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors text-center"
              >
                Keep it
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/marketplace"
            className="px-8 py-3 bg-ume-indigo text-white rounded-full font-semibold hover:bg-indigo-800 transition-colors"
          >
            Back to Marketplace
          </Link>
        )}
      </div>
    )
  }

  // ── CANCELLED / EXPIRED SCREEN ──────────────────────────────────────────────
  if (handshake.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-ume-cream flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h1>
        <p className="text-gray-500 mb-8">The 4-hour window has passed. The listing has been unlocked.</p>
        <Link href="/messages" className="px-8 py-3 bg-ume-indigo text-white rounded-full font-semibold hover:bg-indigo-800 transition-colors">
          Back to Messages
        </Link>
      </div>
    )
  }

  // ── MAIN UI ─────────────────────────────────────────────────────────────────
  const step = statusToStep(handshake.status)

  // Status message for the partner panel
  function getStatusMessage(): { you: string; partner: string } {
    const sellerArrived = !!handshake.seller_arrived_at
    const buyerArrived = !!handshake.buyer_arrived_at
    const pointName =
      campusSafePoints.find((p) => p.id === handshake.safe_point_id)?.name ?? 'a Safe-Point'

    if (handshake.status === 'initiated') {
      return {
        you: 'Tap the button below when you\'re heading to a Safe-Point',
        partner: `Waiting for ${partnerName} to start heading`,
      }
    }
    if (handshake.status === 'in_progress') {
      const myGoing = isHeading
      return {
        you: myGoing ? 'Heading to a Safe-Point — GPS is active' : 'En route...',
        partner: `${partnerName} is heading to a Safe-Point`,
      }
    }
    if (handshake.status === 'seller_arrived') {
      return {
        you: isSeller ? `You arrived at ${pointName}` : 'Heading to a Safe-Point...',
        partner: isSeller ? `Waiting for ${partnerName}` : `${sellerName} is at ${pointName}`,
      }
    }
    if (handshake.status === 'buyer_arrived') {
      return {
        you: isBuyer ? `You arrived at ${pointName}` : 'Heading to a Safe-Point...',
        partner: isBuyer ? `Waiting for ${partnerName}` : `${buyerName} is at ${pointName}`,
      }
    }
    if (handshake.status === 'both_arrived') {
      return {
        you: `You are at ${pointName}`,
        partner: `${partnerName} is here too`,
      }
    }
    if (handshake.status === 'qr_generated') {
      return {
        you: isSeller ? 'Show your QR code to the buyer' : 'Scan the seller\'s QR code',
        partner: isSeller ? `${buyerName} needs to scan the QR` : `${sellerName} is showing the QR code`,
      }
    }
    return { you: '', partner: '' }
  }

  const statusMsg = getStatusMessage()
  const bothArrived = handshake.status === 'both_arrived' || handshake.status === 'qr_generated'
  const canGenerateQR = isSeller && bothArrived
  const canScanQR = isBuyer && handshake.status === 'qr_generated'

  return (
    <div className="min-h-screen bg-ume-cream">
      {/* Header */}
      <div className="bg-ume-indigo text-white px-4 py-4 flex items-center gap-3">
        <Link href="/messages" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight">Safe-Handshake</p>
          <p className="text-indigo-200 text-xs truncate">{listingTitle}</p>
        </div>
        {/* Countdown */}
        {countdown > 0 && (
          <div className={`text-right ${countdown < 600 ? 'text-red-300' : 'text-indigo-200'}`}>
            <p className="text-[10px]">Expires in</p>
            <p className="text-sm font-mono font-bold">{formatCountdown(countdown)}</p>
          </div>
        )}
      </div>

      {/* Step Bar */}
      <StepBar currentStep={step} />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Agreed meeting spot badge */}
        {handshake.safe_point_id && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ume-indigo/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-indigo-500 font-medium uppercase tracking-wide">Agreed meeting spot</p>
              <p className="text-sm font-bold text-ume-indigo">
                {campusSafePoints.find((p) => p.id === handshake.safe_point_id)?.name ?? handshake.safe_point_id}
              </p>
            </div>
          </div>
        )}

        {/* How it works — collapsible instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How it works</h3>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showInstructions && (
            <div className="px-4 pb-4 space-y-3">
              {[
                { n: '1', text: 'Both of you head to the agreed Safe-Point on campus.' },
                { n: '2', text: 'Tap "I\'m heading to a Safe-Point" — GPS will detect when you arrive.' },
                { n: '3', text: 'No GPS? Use the manual picker below to select the location.' },
                { n: '4', text: 'Once both have arrived, the seller taps "Generate QR Code".' },
                { n: '5', text: 'The buyer scans the QR (or enters the code manually) to complete the exchange.' },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-ume-indigo text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.n}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <SafeHandshakeMap
          userLat={userLat}
          userLon={userLon}
          activeSafePointId={myActiveSafePointId}
          partnerSafePointId={partnerActiveSafePointId}
          safePoints={campusSafePoints}
        />

        {/* GPS error */}
        {gpsError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            {gpsError}
          </div>
        )}

        {/* Status panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm">Status</h2>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hasArrived ? 'bg-green-500' : isHeading ? 'bg-yellow-400' : 'bg-gray-300'}`} />
            <div>
              <p className="text-xs font-medium text-gray-700">You</p>
              <p className="text-sm text-gray-600">{statusMsg.you}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              isSeller ? (!!handshake.buyer_arrived_at ? 'bg-green-500' : 'bg-gray-300')
                       : (!!handshake.seller_arrived_at ? 'bg-green-500' : 'bg-gray-300')
            }`} />
            <div>
              <p className="text-xs font-medium text-gray-700">{partnerName}</p>
              <p className="text-sm text-gray-600">{statusMsg.partner}</p>
            </div>
          </div>
        </div>

        {/* Action area */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Step 1 → 2: Heading to Safe-Point (show whenever THIS user hasn't arrived yet) */}
        {!hasArrived && !['both_arrived', 'qr_generated', 'completed', 'cancelled'].includes(handshake.status) && (
          <div className="space-y-3">
            <button
              onClick={handleHeadingToSafePoint}
              disabled={isHeading}
              className="w-full py-4 bg-ume-indigo text-white rounded-2xl font-bold text-base hover:bg-indigo-800 transition-colors disabled:opacity-60 shadow-sm"
            >
              {isHeading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  GPS Active — Detecting Safe-Point...
                </span>
              ) : (
                'I am heading to a Safe-Point'
              )}
            </button>

            {/* Manual arrival selector — shown when GPS is active or has failed */}
            {isHeading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  {gpsError ? 'GPS unavailable — confirm your arrival manually:' : 'No GPS signal yet — or confirm manually:'}
                </p>
                <div className="flex flex-col gap-2">
                  {(handshake.safe_point_id
                    ? campusSafePoints.filter((p) => p.id === handshake.safe_point_id)
                    : campusSafePoints
                  ).map((point) => (
                    <button
                      key={point.id}
                      onClick={() => simulateArrival(point.id)}
                      disabled={actionLoading}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-ume-indigo hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center gap-3"
                    >
                      <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{point.name}</p>
                        <p className="text-xs text-gray-400">{point.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 → 4: Arrived, waiting for partner — only shown to the person who HAS arrived */}
        {(handshake.status === 'seller_arrived' || handshake.status === 'buyer_arrived') && hasArrived && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-4 text-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-yellow-800">Waiting for {partnerName}...</p>
            <p className="text-xs text-yellow-700 mt-1">
              {(() => {
                const name = campusSafePoints.find((p) => p.id === handshake.safe_point_id)?.name
                return name ? `You are at ${name}.` : 'You are at a Safe-Point.'
              })()}
            </p>
          </div>
        )}

        {/* Step 4: Both arrived — Seller generates QR */}
        {canGenerateQR && !qrToken && (
          <button
            onClick={handleGenerateQR}
            disabled={actionLoading}
            className="w-full py-4 bg-ume-indigo text-white rounded-2xl font-bold text-base hover:bg-indigo-800 transition-colors disabled:opacity-60 shadow-sm"
          >
            {actionLoading ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}

        {/* QR Display (seller) */}
        {isSeller && (qrToken || handshake.qr_token) && handshake.status === 'qr_generated' && (
          <div>
            <QRDisplay
              token={qrToken || handshake.qr_token!}
              expiresAt={qrExpiresAt || handshake.qr_token_expires_at!}
            />
            <button
              onClick={handleGenerateQR}
              disabled={actionLoading}
              className="w-full mt-2 py-2.5 border border-ume-indigo text-ume-indigo rounded-full text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              Regenerate QR Code
            </button>
          </div>
        )}

        {/* QR Scanner (buyer) */}
        {canScanQR && (
          <QRScanner onScan={handleScanQR} disabled={actionLoading} />
        )}

        {/* Safe-Points legend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Campus Safe-Points
          </h3>
          <div className="space-y-2">
            {campusSafePoints.map((point) => {
              const isActive = point.id === handshake.safe_point_id
              return (
                <div key={point.id} className={`flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-green-50' : ''}`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{point.name}</p>
                    <p className="text-xs text-gray-400">{point.description}</p>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-xs font-semibold text-green-600">Active</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Safety note */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Safe-Points are located at campus Blue Light emergency stations.
            <br />If you feel unsafe, press the Blue Light button for immediate help.
          </p>
        </div>

        {/* Cancel session */}
        <div className="pb-6">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full py-3 border border-red-200 text-red-400 rounded-2xl text-sm font-semibold hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Cancel Session
          </button>
        </div>
      </div>

      {/* Cancel confirmation overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Cancel this session?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This will cancel the Safe-Handshake and release the listing back to the marketplace. You can start a new session from the messages thread.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelLoading}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep going
              </button>
              <button
                onClick={handleCancelSession}
                disabled={cancelLoading}
                className="flex-1 py-3 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
