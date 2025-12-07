// app/create/page.tsx
import type { Metadata } from 'next'
import { handleCreateListing } from './actions' // server action (Note relative path)
// near other imports in app/create/page.tsx (server file)
import ImageUploader from '@/components/listings/imageuploader'


export const metadata: Metadata = {
  title: 'Create Listing - Reclaim',
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-5xl md:text-6xl font-black text-center mb-12 tracking-tight uppercase">
          CREATE LISTING
        </h1>

        {/* Server form — uses the server action exported in app/create/actions.ts */}
        <form action={handleCreateListing} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Title <span className="text-gray-500">(required)</span>
            </label>
            <input
              name="title"
              required
              className="w-full border border-gray-900 rounded-full px-6 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full border border-gray-900 rounded-3xl px-6 py-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Category <span className="text-gray-500">(required)</span>
            </label>
            <div className="relative">
              <select
                name="category"
                required
                className="w-full border border-gray-900 rounded-full px-6 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer"
              >
                <option value="">Select an option</option>
                <option>Dorm and Decor</option>
                <option>Fun and Craft</option>
                <option>Transportation</option>
                <option>Tech and Gadgets</option>
                <option>Books</option>
                <option>Clothing and Accessories</option>
                <option>Giveaways</option>
                <option>Other</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Condition <span className="text-gray-500">(required)</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="New"
                  className="w-4 h-4 border-2 border-gray-900 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-900">New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="Like New"
                  className="w-4 h-4 border-2 border-gray-900 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-900">Like New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="Used"
                  defaultChecked
                  className="w-4 h-4 border-2 border-gray-900 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-900">Used</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="Refurbished"
                  className="w-4 h-4 border-2 border-gray-900 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-900">Refurbished</span>
              </label>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Photos <span className="text-gray-500">(required)</span>
            </label>
            <div className="border-2 border-dashed border-gray-900 rounded-3xl p-12 bg-white">
              <ImageUploader />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Price <span className="text-gray-500">(required)</span>
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-900">$</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                required
                className="w-full border border-gray-900 rounded-full pl-10 pr-6 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="bg-black text-white font-semibold px-12 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg"
            >
              Post Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
