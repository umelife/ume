import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ReportButton from '@/components/listings/ReportButton'
import ViewListingTracker from '@/components/analytics/ViewListingTracker'
import ListingImages from '@/components/listings/ListingImages'
import CartToggleButton from '@/components/listings/CartToggleButton'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
import BuySection from '@/components/listings/BuySection'
import { formatPrice, getTimeAgo } from '@/lib/utils/helpers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user: currentUser } = await getUser()

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // Fetch seller data (include Stripe status for buy section)
  const { data: user } = await supabase
    .from('users')
    .select('id, display_name, username, college_name, stripe_onboarding_completed')
    .eq('id', listing.user_id)
    .single()

  listing.user = user
  listing.seller = user

  const isOwner = currentUser?.id === listing.user_id

  // Seller display name + avatar initial
  const sellerHandle = user?.username || user?.display_name || ''
  const avatarInitial = sellerHandle[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-ume-bg">
      <ViewListingTracker listingId={listing.id} title={listing.title} category={listing.category} />

      <div className="max-w-7xl mx-auto py-6 md:py-10">
        <div className="grid md:grid-cols-2 md:gap-10 px-4 lg:px-8">

          {/* ── Left: image gallery ── */}
          <div className="mb-5 md:mb-0">
            <ListingImages
              listingId={listing.id}
              altText={listing.title}
              condition={listing.condition}
            />
          </div>

          {/* ── Right: info + actions ── */}
          <div className="flex flex-col gap-4">

            {/* ── Info card ── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">

              {/* Category · Condition — pink uppercase label (no background) */}
              <p className="text-xs text-ume-pink font-bold uppercase tracking-widest mb-2">
                {listing.category}{listing.condition ? ` · ${listing.condition}` : ''}
              </p>

              {/* Title — Archivo Black, uppercase, tight */}
              <h1 className="font-[family:var(--font-archivo-black)] text-2xl sm:text-3xl uppercase tracking-tight leading-tight text-ume-indigo mb-4">
                {listing.title}
              </h1>

              {/* Posted time chip */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs bg-ume-cream text-ume-indigo font-semibold px-3 py-1 rounded-full">
                  Posted {getTimeAgo(listing.created_at)}
                </span>
              </div>

              {/* Price — bordered box per design system */}
              <div className="flex items-baseline gap-3 border border-gray-200 rounded-2xl px-5 py-4 mb-5">
                <span className="font-[family:var(--font-archivo-black)] text-3xl text-ume-indigo tracking-tight">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-xs text-gray-400 ml-auto">Free campus pickup</span>
              </div>

              {/* Description */}
              {listing.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  {listing.description}
                </p>
              )}

              {/* Seller card — cream background with avatar initial */}
              {user && (
                <Link
                  href={`/profile/${listing.user_id}`}
                  className="flex items-center gap-3 bg-ume-cream rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-ume-indigo text-white flex items-center justify-center font-[family:var(--font-archivo-black)] text-sm flex-shrink-0">
                    {avatarInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ume-indigo group-hover:text-ume-pink transition-colors truncate">
                      @{sellerHandle}
                    </p>
                    {user.college_name && (
                      <p className="text-xs text-gray-500 truncate">{user.college_name}</p>
                    )}
                  </div>
                  {/* Chevron */}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>

            {/* ── Action card — buyers ── */}
            {currentUser && !isOwner && (
              <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                <BuySection
                  listing={{
                    id: listing.id,
                    title: listing.title,
                    price: listing.price,
                    user_id: listing.user_id,
                    seller: listing.seller,
                  }}
                  currentUserId={currentUser.id}
                />
                <CartToggleButton
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  currentUserId={currentUser.id}
                />
                <div>
                  <ReportButton listingId={listing.id} />
                </div>
              </div>
            )}

            {/* ── Action card — owner ── */}
            {isOwner && (
              <div className="bg-white rounded-2xl shadow-sm p-5 flex gap-3">
                <Link
                  href={`/edit/${listing.id}`}
                  className="flex-1 text-center py-3 bg-ume-indigo text-white font-semibold text-sm rounded-full hover:bg-indigo-800 transition-colors"
                >
                  Edit Listing
                </Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            )}

            {/* ── Guest — save to liked only ── */}
            {!currentUser && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <CartToggleButton listingId={listing.id} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
