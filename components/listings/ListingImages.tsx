'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ListingImagesProps {
  listingId: string
  altText?: string
}

export default function ListingImages({ listingId, altText = 'Listing image' }: ListingImagesProps) {
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-24 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Failed to load images</p>
        </div>
      </div>
    )
  }

  // No images placeholder
  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No images available</p>
        </div>
      </div>
    )
  }

  // Render images
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={images[selectedImage]}
          alt={`${altText} - Image ${selectedImage + 1}`}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative w-full aspect-square rounded overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? 'border-blue-600 ring-2 ring-blue-600'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${altText} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
