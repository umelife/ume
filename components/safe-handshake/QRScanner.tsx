'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onScan: (token: string) => void
  disabled?: boolean
}

export default function QRScanner({ onScan, disabled }: Props) {
  const [manualToken, setManualToken] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<unknown>(null)
  const elementId = 'qr-scanner-element'

  async function startScanner() {
    try {
      setError(null)
      setScannerActive(true)
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode(elementId)
      scannerRef.current = qr

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          stopScanner()
          onScan(decodedText.trim())
        },
        undefined
      )
    } catch (err) {
      console.error('QR scanner error:', err)
      setError('Could not access camera. Use the code input below instead.')
      setScannerActive(false)
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const { Html5Qrcode } = await import('html5-qrcode')
        const qr = scannerRef.current as InstanceType<typeof Html5Qrcode>
        if (qr.isScanning) {
          await qr.stop()
        }
        scannerRef.current = null
      }
    } catch {}
    setScannerActive(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-sm font-semibold text-gray-700">Scan the seller&apos;s QR code</p>

      {/* Camera scanner area */}
      <div
        id={elementId}
        className={`w-full max-w-[260px] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 ${
          scannerActive ? 'border-ume-indigo' : ''
        }`}
        style={{ minHeight: scannerActive ? 260 : 0 }}
      />

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {!scannerActive ? (
        <button
          onClick={startScanner}
          disabled={disabled}
          className="w-full py-3 bg-ume-indigo text-white rounded-full font-semibold text-sm hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Open Camera
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cancel scanning
        </button>
      )}

      {/* Manual fallback */}
      <div className="w-full border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 text-center mb-2">Or enter the code manually</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste or type the code..."
            disabled={disabled}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-ume-indigo/30"
          />
          <button
            onClick={() => {
              if (manualToken.trim()) {
                onScan(manualToken.trim())
                setManualToken('')
              }
            }}
            disabled={!manualToken.trim() || disabled}
            className="px-4 py-2 bg-ume-indigo text-white rounded-xl text-xs font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
