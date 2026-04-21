'use client'

import { useEffect, useState } from 'react'

/**
 * InstallPrompt
 *
 * Shows a "Add to Home Screen" banner once per week.
 * - Chrome/Android: captures the beforeinstallprompt event and shows a native install button
 * - iOS Safari: shows manual instructions (Share → Add to Home Screen)
 * - Already installed (standalone mode): never shows
 * - Dismissed: hidden for 7 days
 */

const DISMISS_KEY = 'ume-install-prompt-dismissed'
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
}

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY)
    if (!ts) return false
    return Date.now() - parseInt(ts, 10) < DISMISS_TTL
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Never show if already installed or dismissed recently
    if (isStandalone() || wasDismissedRecently()) return

    const ios = isIos()
    setIsIosDevice(ios)

    if (ios) {
      // iOS can't use beforeinstallprompt — show manual instructions after a short delay
      const t = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(t)
    }

    // Chrome / Android — listen for the native install event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss()
    }
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()) } catch { /* noop */ }
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Add UME to home screen"
      className="fixed bottom-20 left-3 right-3 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex gap-3 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-ume-indigo flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-[family:var(--font-archivo-black)] text-sm text-ume-indigo uppercase tracking-tight leading-tight">
            Add UME to your homescreen
          </p>
          {isIosDevice ? (
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Tap <span className="font-semibold">Share</span> then{' '}
              <span className="font-semibold">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Get the full app experience — instant access, faster load.
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Not now
            </button>
            {!isIosDevice && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="text-xs bg-ume-pink text-white font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Add to Home Screen
              </button>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
