import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { getCommunityCategory } from '@/data/community-categories'
import PostCard from '@/components/communities/PostCard'
import PostComposer from '@/components/communities/PostComposer'
import CommunityJoinButton from './CommunityJoinButton'
import type { Community, CommunityPost, UMEEvent } from '@/types/database'
import { format } from 'date-fns'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { user } = await getUser()

  const { data: community, error } = await supabase
    .from('communities')
    .select('*, creator:users!creator_id(id, username, display_name, avatar_url)')
    .eq('slug', slug)
    .single()

  if (error || !community) {
    console.error('Community fetch error:', error?.message, '| slug:', slug)
    notFound()
  }

  const c = community as Community

  // Posts
  const { data: postsData } = await supabase
    .from('community_posts')
    .select('*, author:users!author_id(id, username, display_name, avatar_url)')
    .eq('community_id', c.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // Member status
  let isMember = false
  let memberRole: string | null = null
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', c.id)
      .eq('user_id', user.id)
      .maybeSingle()
    isMember = !!mem
    memberRole = mem?.role ?? null
  }

  // Voted posts set
  let votedPostIds = new Set<string>()
  if (user && postsData?.length) {
    const { data: votes } = await supabase
      .from('post_votes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postsData.map(p => p.id))
    votedPostIds = new Set(votes?.map(v => v.post_id) ?? [])
  }

  const posts: CommunityPost[] = (postsData ?? []).map(p => ({
    ...p,
    has_voted: votedPostIds.has(p.id),
  }))

  // Upcoming events
  const { data: eventsData } = await supabase
    .from('events')
    .select('*, community:communities(name, slug)')
    .eq('community_id', c.id)
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)
  const events = (eventsData ?? []) as UMEEvent[]

  const cat = getCommunityCategory(c.category)
  const canPost = isMember || !c.is_private
  const canCreateEvent = isMember && ['owner', 'moderator'].includes(memberRole ?? '')

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      {/* Cover */}
      <div className="relative h-40 sm:h-52 bg-gradient-to-br from-ume-indigo to-purple-700 overflow-hidden">
        {c.cover_image_url && (
          <Image src={c.cover_image_url} alt="" fill unoptimized className="object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header card */}
        <div className="-mt-12 bg-white rounded-3xl shadow-md border border-gray-100 p-5 sm:p-6 mb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-ume-indigo/10 to-ume-pink/20 flex items-center justify-center text-4xl shrink-0 shadow-sm">
              {cat?.emoji ?? '✨'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                  {c.name}
                </h1>
                <span className="bg-ume-cream text-ume-indigo text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full self-center">
                  {cat?.display}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {c.member_count} members
                {c.city || c.state ? ` · ${[c.city, c.state].filter(Boolean).join(', ')}` : ''}
                {c.campus ? ` · Campus community` : ''}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {memberRole === 'owner' && (
                <Link
                  href={`/communities/${slug}/settings`}
                  className="text-xs text-gray-400 hover:text-ume-indigo transition-colors p-2"
                  aria-label="Community settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              )}
              {user ? (
                <CommunityJoinButton
                  communityId={c.id}
                  isMember={isMember}
                  isOwner={memberRole === 'owner'}
                />
              ) : (
                <Link
                  href={`/login?redirect=/communities/${slug}`}
                  className="bg-ume-indigo text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-indigo-800 transition-colors"
                >
                  Sign in to join
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main — posts */}
          <div className="lg:col-span-2 space-y-3">
            {user && canPost && (
              <PostComposer communityId={c.id} communitySlug={slug} />
            )}
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-gray-500">No posts yet — be the first to post.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  communitySlug={slug}
                  communityId={c.id}
                  currentUserId={user?.id}
                  isModerator={['owner', 'moderator'].includes(memberRole ?? '')}
                />
              ))
            )}
          </div>

          {/* Sidebar — events */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Upcoming events</h2>
                <Link href={`/communities/${slug}/events`} className="text-xs text-ume-indigo font-semibold hover:underline">
                  See all
                </Link>
              </div>
              {events.length === 0 ? (
                <p className="text-xs text-gray-400">No upcoming events.</p>
              ) : (
                <ul className="space-y-2">
                  {events.map(e => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.id}`}
                        className="flex items-start gap-2 hover:bg-gray-50 rounded-xl p-2 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-ume-indigo/5 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-ume-indigo leading-none">
                            {format(new Date(e.starts_at), 'MMM').toUpperCase()}
                          </span>
                          <span className="text-sm font-black text-ume-indigo leading-none">
                            {format(new Date(e.starts_at), 'd')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-1">{e.title}</p>
                          <p className="text-[10px] text-gray-400">{format(new Date(e.starts_at), 'h:mm a')}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {canCreateEvent && (
                <Link
                  href={`/events/create?community=${c.id}`}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-ume-indigo border border-ume-indigo rounded-full py-2 hover:bg-ume-indigo hover:text-white transition-colors"
                >
                  <span>+</span> New event
                </Link>
              )}
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-gray-900 mb-2">About</h2>
              <p className="text-xs text-gray-600 leading-relaxed">{c.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Created by @{c.creator?.username || c.creator?.display_name}
              </p>
            </div>

            {/* Rules */}
            {(c as any).rules?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Community rules</h2>
                <ol className="space-y-2">
                  {((c as any).rules as string[]).map((rule: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-ume-indigo/10 text-ume-indigo text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
