'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSwipe } from '@/hooks/useSwipe'

interface ListingImagesProps {
  listingId: string
  altText?: string
  condition?: string
}

export default function ListingImages({ listingId, altText = 'Listing image', condition }: ListingImagesProps) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true)
        setError(false)

        const response = await fetch(`/api/listings/${listingId}/images`)

        if (!response.ok) {
          throw new Error('Failed to fetch images')
        }

        const data = await response.json()

        if (data.images && data.images.length > 0) {
          setImages(data.images)
        } else {
          setImages([])
        }
      } catch (err) {
        console.error('Error fetching listing images:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchImages()
    }
  }, [listingId])

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => setSelectedImage(i => (i + 1) % images.length),
    () => setSelectedImage(i => (i - 1 + images.length) % images.length)
  )

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full md:space-y-3">
        <div className="w-full aspect-square bg-gray-200 animate-pulse md:rounded-2xl" />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 px-4 md:px-0 mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full aspect-square bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full aspect-square bg-ume-cream md:rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Failed to load images</p>
        </div>
      </div>
    )
  }

  // No images placeholder
  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-ume-cream md:rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No images available</p>
        </div>
      </div>
    )
  }

  // Render images
  return (
    <div className="w-full md:space-y-3">
      {/* Main image — square aspect ratio */}
      <div
        className="relative w-full aspect-square bg-ume-cream md:rounded-2xl overflow-hidden md:shadow-md"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[selectedImage]}
          alt={`${altText} - Image ${selectedImage + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={selectedImage === 0}
        />

        {/* Condition badge — top-right per design system */}
        {condition && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            {condition}
          </div>
        )}

        {/* Dot indicators — bottom-center, only when multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-200 ${
                  i === selectedImage ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — only shown when multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-2 px-4 md:px-0 mt-3">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all shadow-sm hover:shadow-md ${
                selectedImage === index
                  ? 'border-ume-indigo ring-2 ring-ume-indigo ring-offset-1'
                  : 'border-gray-200 hover:border-ume-indigo/50'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={img}
                alt={`${altText} - Thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
