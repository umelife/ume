'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const supabase = createClient()

const MAX_IMAGES = 10
const MAX_WIDTH = 1200

async function compressToWebP(file: File): Promise<{ file: File; savedPercent: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_WIDTH / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve({ file, savedPercent: 0 }); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve({ file, savedPercent: 0 }); return }
          const savedPercent = Math.round((1 - blob.size / file.size) * 100)
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.webp'),
            { type: 'image/webp' }
          )
          resolve({ file: compressed, savedPercent: Math.max(0, savedPercent) })
        },
        'image/webp',
        0.82
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ file, savedPercent: 0 }) }
    img.src = url
  })
}

/**
 * ImageUploaderClean Component
 *
 * Clean, minimal image uploader matching the Create Listing screenshot design.
 * Features dashed border box, centered "+Add a File" prompt, and thumbnail previews.
 */
export default function ImageUploaderClean({
  inputName = 'imageUrls',
  existingImages = []
}: {
  inputName?: string
  existingImages?: string[]
}) {
  const [urls, setUrls] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedPercent, setSavedPercent] = useState<number | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the limit
    const totalImages = urls.length + files.length
    if (totalImages > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You currently have ${urls.length} image(s). You can only add ${MAX_IMAGES - urls.length} more.`)
      return
    }

    setUploading(true)
    setError(null)
    setSavedPercent(null)

    const uploadedUrls: string[] = []

    // get current user id from session (needed for pathing)
    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes?.data?.session?.user?.id
    if (!userId) {
      setError('Not authenticated (upload requires sign-in).')
      setUploading(false)
      return
    }

    let totalSaved = 0
    let totalFiles = 0

    for (let i = 0; i < files.length; i++) {
      const original = files[i]
      const { file, savedPercent: pct } = await compressToWebP(original)
      totalSaved += pct
      totalFiles++

      const fileName = `${Math.random().toString(36).substring(2, 12)}.webp`
      const path = `${userId}/${fileName}`

      // upload
      const { data: up, error: upErr } = await supabase.storage
        .from('listings')
        .upload(path, file)

      if (upErr) {
        console.error('upload error', upErr)
        setError(upErr.message)
        continue
      }

      // get public url
      const { data: publicData } = supabase.storage
        .from('listings')
        .getPublicUrl(path)

      if (publicData?.publicUrl) {
        uploadedUrls.push(publicData.publicUrl)
      }
    }

    // append to existing list
    setUrls((s) => [...s, ...uploadedUrls])
    if (totalFiles > 0) setSavedPercent(Math.round(totalSaved / totalFiles))
    setUploading(false)
  }

  function removeUrl(index: number) {
    setUrls((s) => s.filter((_, i) => i !== index))
  }

  const remainingSlots = MAX_IMAGES - urls.length
  const isAtLimit = urls.length >= MAX_IMAGES

  return (
    <div className="space-y-4">
      {/* Upload Area - Dashed Border Box */}
      <label
        className={`
          relative block border-2 border-dashed rounded-3xl p-12
          transition-all cursor-pointer
          ${isAtLimit
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-900 bg-white hover:bg-gray-50'
          }
        `}
        aria-label="Upload listing images"
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={isAtLimit || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-describedby="upload-instructions"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {/* Plus Icon */}
          <div className="mb-2">
            <svg
              className="w-8 h-8 text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>

          {/* Text */}
          <p className="text-gray-900 font-medium">
            {uploading ? 'Uploading...' : 'Add a File'}
          </p>

          {/* File count */}
          <p className="text-sm text-gray-500 mt-2" id="upload-instructions">
            {urls.length} / {MAX_IMAGES} images
          </p>
        </div>
      </label>

      {/* Compression savings */}
      {savedPercent !== null && savedPercent > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3" role="status">
          <p className="text-green-800 text-sm">✓ Images optimized — saved ~{savedPercent}% file size</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3"
          role="alert"
          aria-live="polite"
        >
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* At Limit Warning */}
      {isAtLimit && (
        <div
          className="bg-orange-50 border border-orange-200 rounded-lg p-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-orange-700">
            You've reached the maximum of {MAX_IMAGES} images. Remove some to add new ones.
          </p>
        </div>
      )}

      {/* Image Previews */}
      {urls.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square group"
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={url}
                  alt={`Upload preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 20vw, 15vw"
                />
              </div>
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="
                  absolute -top-2 -right-2
                  bg-red-600 text-white rounded-full
                  w-7 h-7 flex items-center justify-center
                  text-lg font-medium shadow-md
                  hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  transition-colors
                  opacity-0 group-hover:opacity-100 focus:opacity-100
                "
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input so server action receives imageUrls JSON */}
      <input
        type="hidden"
        name={inputName}
        value={JSON.stringify(urls)}
        aria-hidden="true"
      />
    </div>
  )
}
