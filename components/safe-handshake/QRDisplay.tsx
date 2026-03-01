'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

interface Props {
  token: string
  expiresAt: string
}

export default function QRDisplay({ token, expiresAt }: Props) {
  const [copied, setCopied] = useState(false)

  const expiry = new Date(expiresAt)
  const now = new Date()
  const secondsLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000))
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  async function handleCopy() {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-sm font-semibold text-gray-700">Show this QR code to the buyer</p>
      <div className="p-3 bg-white border-2 border-ume-indigo rounded-xl">
        <QRCode
          value={token}
          size={200}
          fgColor="#130170"
          bgColor="#ffffff"
          level="M"
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>
          Expires in{' '}
          <span className="font-semibold text-gray-700">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </span>
      </div>

      {/* Copy code button — useful for testing without a camera */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy code for manual entry
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center max-w-[220px]">
        This code is single-use and expires in 5 minutes. Generate a new one if it expires.
      </p>
    </div>
  )
}
