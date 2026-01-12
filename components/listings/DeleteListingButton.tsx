'use client'

import { deleteListing } from '@/lib/listings/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const result = await deleteListing(listingId)
    setLoading(false)

    if (result?.success) {
      setShowConfirm(false)
      setShowSuccess(true)
    }
  }

  // Success modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Listing Deleted
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your listing has been successfully deleted.
            </p>
            <a
              href="/marketplace"
              className="inline-block w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-center"
            >
              Browse Marketplace
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="bg-black text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-800"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-black text-white px-2 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Confirm'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
      >
        Cancel
      </button>
    </div>
  )
}
