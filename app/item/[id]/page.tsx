import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description, image_urls, price')
    .eq('id', id)
    .single()

  if (!listing) return { title: 'Listing' }

  const title = listing.title
  const description = listing.description?.slice(0, 155) ?? `Buy ${title} on UME — the campus marketplace.`
  const image = listing.image_urls?.[0]
  const price = listing.price ? `$${(listing.price / 100).toFixed(2)}` : undefined

  return {
    title,
    description: price ? `${price} — ${description}` : description,
    openGraph: {
      title: `${title} | UME`,
      description,
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | UME`,
      description,
      ...(image && { images: [image] }),
    },
  }
}
import ReportButton from '@/components/listings/ReportButton'
import ViewListingTracker from '@/components/analytics/ViewListingTracker'
import ListingImages from '@/components/listings/ListingImages'
import CartToggleButton from '@/components/listings/CartToggleButton'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
import ShareToCommunityButton from '@/components/listings/ShareToCommunityButton'
import VerifiedBadge from '@/components/VerifiedBadge'
import BuySection from '@/components/listings/BuySection'
import HomeSectionRow from '@/components/homepage/HomeSectionRow'
import HomeListingCard from '@/components/homepage/HomeListingCard'
import { getSimilarListings } from '@/lib/listings/actions'
import { formatPrice, getTimeAgo } from '@/lib/utils/helpers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

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
    .select('id, display_name, username, college_name, account_type, stripe_onboarding_completed')
    .eq('id', listing.user_id)
    .single()

  listing.user = user
  listing.seller = user

  const isOwner = currentUser?.id === listing.user_id

  // Fetch similar listings (same category + campus, exclude current)
  const similarListings = await getSimilarListings(
    listing.id,
    listing.category,
    listing.seller_campus_id ?? null,
  )

  // Seller display name + avatar initial
  const sellerHandle = user?.username || user?.display_name || ''
  const avatarInitial = sellerHandle[0]?.toUpperCase() ?? '?'

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description ?? undefined,
    "image": listing.image_urls?.[0] ?? undefined,
    "url": `https://ume-life.com/item/${listing.id}`,
    "offers": {
      "@type": "Offer",
      "price": listing.price ? (listing.price / 100).toFixed(2) : "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": user?.display_name ?? user?.username ?? "UME Seller",
      },
    },
    "category": listing.category ?? undefined,
    "condition": listing.condition === "Like New"
      ? "https://schema.org/LikeNewCondition"
      : listing.condition === "Used"
      ? "https://schema.org/UsedCondition"
      : "https://schema.org/NewCondition",
  }

  return (
    <div className="min-h-screen bg-ume-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ViewListingTracker listingId={listing.id} title={listing.title} category={listing.category} />

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row md:gap-10 lg:gap-14">

          {/* ── Left: image gallery ── */}
          <div className="w-full md:w-1/2 lg:w-[55%] mb-6 md:mb-0 md:sticky md:top-6 md:self-start">
            <ListingImages
              listingId={listing.id}
              altText={listing.title}
              condition={listing.condition}
            />
          </div>

          {/* ── Right: info + actions ── */}
          <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col gap-4">

            {/* ── Info card ── */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-6">

                {/* Price badge + posted time */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className="bg-ume-indigo text-white text-lg font-[family:var(--font-archivo-black)] px-4 py-1.5 rounded-xl tracking-tight border-0 shadow-indigo"
                  >
                    {formatPrice(listing.price)}
                  </Badge>
                  <span className="text-xs text-gray-400 font-medium">
                    {getTimeAgo(listing.created_at)}
                  </span>
                </div>

                {/* Category + condition chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {listing.category && (
                    <Badge
                      variant="outline"
                      className="text-ume-pink border-ume-pink/40 bg-ume-pink/8 text-[11px] font-bold uppercase tracking-widest rounded-full px-3 py-0.5"
                    >
                      {listing.category}
                    </Badge>
                  )}
                  {listing.condition && (
                    <Badge
                      variant="outline"
                      className="text-gray-500 border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider rounded-full px-3 py-0.5"
                    >
                      {listing.condition}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-[family:var(--font-archivo-black)] text-2xl sm:text-3xl uppercase tracking-tight leading-tight text-ume-indigo mb-5">
                  {listing.title}
                </h1>

                <Separator className="mb-5 bg-gray-100" />

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {/* Fulfillment */}
                  <div className="flex items-center gap-2.5 bg-ume-bg rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-ume-indigo/10 text-ume-indigo shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Pickup</p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {listing.fulfillment_type === 'shipping' ? 'Shipping' : 'Campus'}
                      </p>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="flex items-center gap-2.5 bg-ume-bg rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-ume-pink/15 text-ume-pink shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Condition</p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {listing.condition || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2.5 bg-ume-bg rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-ume-indigo/10 text-ume-indigo shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="7" height="7" rx="1"/>
                        <rect x="15" y="3" width="7" height="7" rx="1"/>
                        <rect x="2" y="14" width="7" height="7" rx="1"/>
                        <rect x="15" y="14" width="7" height="7" rx="1"/>
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Category</p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {listing.category || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center gap-2.5 bg-ume-bg rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-ume-pink/15 text-ume-pink shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 13h12l1-13M10 12v5m4-5v5" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Shipping</p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {listing.fulfillment_type === 'shipping' ? 'Available' : 'Pickup only'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {listing.description && (
                  <>
                    <Separator className="mb-4 bg-gray-100" />
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">
                      {listing.description}
                    </p>
                  </>
                )}

                <Separator className="mb-4 bg-gray-100" />

                {/* Seller card */}
                {user && (
                  <Link
                    href={`/profile/${listing.user_id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-ume-bg px-4 py-3 hover:bg-gray-100 transition-colors group"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-ume-indigo text-white font-[family:var(--font-archivo-black)] text-sm">
                        {avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-ume-indigo group-hover:text-ume-pink transition-colors truncate inline-flex items-center gap-1">
                        @{sellerHandle}
                        {user.account_type === 'student' && <VerifiedBadge />}
                      </p>
                      {user.college_name && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            className="bg-ume-pink/15 text-ume-pink border-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0 rounded-full leading-5"
                          >
                            {user.college_name}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* ── Action card — buyers ── */}
            {currentUser && !isOwner && (
              <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="p-5 space-y-3">
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
                </CardContent>
              </Card>
            )}

            {/* ── Action card — owner ── */}
            {isOwner && (
              <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="flex-1 bg-ume-indigo text-white hover:bg-ume-indigo-900 font-semibold rounded-full h-11"
                    >
                      <Link href={`/edit/${listing.id}`}>Edit Listing</Link>
                    </Button>
                    <DeleteListingButton listingId={listing.id} />
                  </div>
                  <ShareToCommunityButton listingId={listing.id} />
                </CardContent>
              </Card>
            )}

            {/* ── Guest — save to liked only ── */}
            {!currentUser && (
              <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="p-5">
                  <CartToggleButton listingId={listing.id} />
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ── Similar listings ── */}
      {similarListings.length > 0 && (
        <div className="mt-4 pb-8">
          <HomeSectionRow
            title={`More in ${listing.category}`}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="2" y="3" width="7" height="7" rx="1"/>
                <rect x="15" y="3" width="7" height="7" rx="1"/>
                <rect x="2" y="14" width="7" height="7" rx="1"/>
                <rect x="15" y="14" width="7" height="7" rx="1"/>
              </svg>
            }
            viewAllHref={`/marketplace?category=${encodeURIComponent(listing.category)}`}
          >
            {similarListings.map((item) => (
              <HomeListingCard key={item.id} listing={item} />
            ))}
          </HomeSectionRow>
        </div>
      )}

    </div>
  )
}
