import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ProfileSettings from '@/components/profile/ProfileSettings'
import ProfileListings from '@/components/profile/ProfileListings'
import StripeOnboardingBanner from '@/components/seller/StripeOnboardingBanner'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ stripe?: string }>
}) {
  const { id } = await params
  const { stripe: stripeReturnStatus } = await searchParams
  const supabase = await createClient()
  const { user: currentUser } = await getUser()

  const { data: profileUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (userError || !profileUser) {
    notFound()
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const isOwnProfile = currentUser?.id === id
  const displayName = profileUser.username || profileUser.display_name || 'User'

  // Attach user object to each listing so ProductGrid can show seller info
  const listingsWithUser = (listings ?? []).map(l => ({ ...l, user: profileUser }))

  const joinDate = new Date(profileUser.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const listingCount = listingsWithUser.length

  return (
    <div className="min-h-screen bg-ume-bg">

      {/* ── Profile Hero ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Gradient banner */}
        <div
          className="h-36 sm:h-44 w-full"
          style={{
            background: 'linear-gradient(135deg, #130170 0%, #2d01e0 50%, #fa9ebc 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content card that overlaps the banner */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="-mt-14 sm:-mt-16 pb-6 sm:pb-8">
            <Card className="shadow-lg border-0 overflow-visible">
              <CardContent className="p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">

                  {/* Avatar — overlaps card top edge */}
                  <div className="-mt-16 sm:-mt-20 flex-shrink-0">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white shadow-lg">
                      <AvatarFallback
                        className="text-4xl sm:text-5xl font-black text-white select-none"
                        style={{ background: 'linear-gradient(135deg, #130170, #fa9ebc)' }}
                      >
                        {(displayName?.[0] ?? '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                      <h1 className="text-2xl sm:text-3xl font-black text-ume-indigo truncate">
                        @{displayName}
                      </h1>
                      {profileUser.college_name && (
                        <Badge
                          className="self-center sm:self-auto text-xs font-semibold"
                          style={{ background: '#f3f4ff', color: '#130170', border: '1px solid #d0d5ff' }}
                        >
                          {profileUser.college_name}
                        </Badge>
                      )}
                    </div>

                    {profileUser.university_domain && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {profileUser.university_domain}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-ume-indigo/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Joined {joinDate}</span>
                      </div>

                      <Separator orientation="vertical" className="h-4 hidden sm:block" />

                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-ume-indigo">{listingCount}</span>
                        <span className="text-sm text-muted-foreground">
                          {listingCount === 1 ? 'listing' : 'listings'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA for own profile */}
                  {isOwnProfile && (
                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                      <Button
                        asChild
                        className="rounded-full font-semibold px-6 text-white"
                        style={{ background: '#fa9ebc' }}
                      >
                        <Link href="/create">+ New Listing</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">

        {/* Stripe onboarding banner — own profile only */}
        {isOwnProfile && (
          <StripeOnboardingBanner
            isConnected={profileUser.stripe_onboarding_completed ?? false}
            stripeReturnStatus={stripeReturnStatus ?? null}
          />
        )}

        {/* Profile Settings — own profile only */}
        {isOwnProfile && (
          <ProfileSettings
            currentDisplayName={displayName}
            userId={id}
            currentCollegeName={profileUser.college_name}
            currentCollegeAddress={profileUser.college_address}
          />
        )}

        {/* Listings section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-ume-indigo">
              {isOwnProfile ? 'Your Listings' : 'Listings'}
            </h2>
            {listingCount > 0 && (
              <Badge variant="secondary" className="font-semibold">
                {listingCount}
              </Badge>
            )}
          </div>
          <ProfileListings listings={listingsWithUser} isOwnProfile={isOwnProfile} />
        </div>

      </div>
    </div>
  )
}
