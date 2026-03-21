import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ProfileSettings from '@/components/profile/ProfileSettings'
import ProfileListings from '@/components/profile/ProfileListings'
import StripeOnboardingBanner from '@/components/seller/StripeOnboardingBanner'
import { notFound } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-ume-bg">

      {/* Profile Hero */}
      <div className="bg-ume-cream border-b border-ume-indigo/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-ume-indigo flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-4xl sm:text-5xl font-black text-white select-none">
                {(displayName?.[0] ?? '?').toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-ume-indigo">
                @{displayName}
              </h1>
              {profileUser.college_name && (
                <p className="text-gray-600 mt-1 text-base">{profileUser.college_name}</p>
              )}
              {profileUser.university_domain && (
                <p className="text-sm text-gray-400 mt-0.5">{profileUser.university_domain}</p>
              )}
              <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
                <span className="text-sm text-gray-500">
                  Member since {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-sm font-semibold text-ume-indigo">
                  {listingsWithUser.length} {listingsWithUser.length === 1 ? 'listing' : 'listings'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

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

        {/* Listings heading */}
        <div>
          <h2 className="text-xl font-bold text-ume-indigo mb-5">
            {isOwnProfile ? 'Your Listings' : 'Listings'}
          </h2>
          <ProfileListings listings={listingsWithUser} isOwnProfile={isOwnProfile} />
        </div>

      </div>
    </div>
  )
}
