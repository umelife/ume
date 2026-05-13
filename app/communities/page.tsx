import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import CommunityCard from '@/components/communities/CommunityCard'
import StateFilter from '@/components/communities/StateFilter'
import { COMMUNITY_CATEGORIES } from '@/data/community-categories'
import { CAMPUSES } from '@/data/safe-points'
import type { Community } from '@/types/database'

export const metadata: Metadata = {
  title: 'Communities',
  description: 'Join student communities across the US — study groups, clubs, gaming, fitness and more.',
  alternates: { canonical: '/communities' },
}

interface PageProps {
  searchParams: Promise<{ category?: string; state?: string; q?: string }>
}


export default async function CommunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { user } = await getUser()

  let query = supabase
    .from('communities')
    .select('*, creator:users!creator_id(id, username, display_name, avatar_url)')
    .eq('status', 'active')
    .order('member_count', { ascending: false })
    .limit(60)

  if (params.category) query = query.eq('category', params.category)
  if (params.state) query = query.eq('state', params.state)
  if (params.q) query = query.ilike('name', `%${params.q}%`)

  const { data } = await query
  const communities = (data ?? []) as Community[]

  // Campus communities for logged-in students
  let campusCommunities: Community[] = []
  const isStudent = !user?.user_metadata?.account_type || user.user_metadata.account_type === 'student'
  if (user && isStudent) {
    const campus = CAMPUSES.find(c =>
      c.emailDomains.some(d => user?.email?.endsWith('@' + d) || user?.email?.endsWith('.' + d))
    )
    if (campus) {
      const { data: cd } = await supabase
        .from('communities')
        .select('*, creator:users!creator_id(id, username, display_name, avatar_url)')
        .eq('campus', campus.id)
        .eq('status', 'active')
        .limit(6)
      campusCommunities = (cd ?? []) as Community[]
    }
  }

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-ume-indigo via-indigo-700 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                COMMUNITIES
              </h1>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-md">
                Join student communities across the US — study groups, clubs, gaming, and more. Active year-round.
              </p>
            </div>
            {user && (
              <Link
                href="/communities/create"
                className="inline-flex items-center gap-2 bg-ume-pink hover:bg-ume-pink/90 text-white font-semibold px-5 py-2.5 rounded-full shadow-md transition-colors self-start sm:self-end"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                Start a community
              </Link>
            )}
          </div>
          <form method="get" className="mt-6 flex gap-2 max-w-lg">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search communities..."
              className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-white/20"
            />
            <button type="submit" className="bg-white text-ume-indigo font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white/90 transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto">
          <Link
            href="/communities"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              !params.category ? 'bg-ume-indigo text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >All</Link>
          {COMMUNITY_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/communities?category=${c.slug}${params.state ? `&state=${params.state}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-colors ${
                params.category === c.slug ? 'bg-ume-indigo text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{c.emoji}</span><span>{c.display}</span>
            </Link>
          ))}
          <StateFilter basePath="/communities" currentState={params.state} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {!params.category && !params.state && !params.q && campusCommunities.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your campus</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {campusCommunities.map(c => <CommunityCard key={c.id} community={c} />)}
            </div>
          </section>
        )}
        <section>
          {!params.category && !params.state && !params.q && (
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">All communities</h2>
          )}
          {communities.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-base">No communities found.{' '}
                {user
                  ? <Link href="/communities/create" className="text-ume-indigo font-semibold">Start one →</Link>
                  : <Link href="/signup" className="text-ume-indigo font-semibold">Sign up to create one →</Link>
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {communities.map(c => <CommunityCard key={c.id} community={c} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
