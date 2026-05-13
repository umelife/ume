import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import EventCard from '@/components/events/EventCard'
import type { UMEEvent } from '@/types/database'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityEventsPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { user } = await getUser()

  const { data: community, error } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !community) notFound()

  const { data: eventsData } = await supabase
    .from('events')
    .select('*, community:communities(name, slug, cover_image_url)')
    .eq('community_id', community.id)
    .gte('starts_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .order('starts_at', { ascending: true })

  const events = (eventsData ?? []) as UMEEvent[]

  let memberRole: string | null = null
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .maybeSingle()
    memberRole = mem?.role ?? null
  }

  const canCreateEvent = memberRole && ['owner', 'moderator'].includes(memberRole)

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/communities/${slug}`}
              className="text-sm text-ume-indigo/70 hover:text-ume-indigo font-semibold inline-flex items-center gap-1 mb-1"
            >
              ← {community.name}
            </Link>
            <h1
              className="text-2xl font-black text-gray-900"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Upcoming Events
            </h1>
          </div>
          {canCreateEvent && (
            <Link
              href={`/events/create?community=${community.id}`}
              className="inline-flex items-center gap-1.5 bg-ume-indigo text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-indigo-800 transition-colors"
            >
              <span>+</span> New event
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-1">No upcoming events in this community.</p>
            {canCreateEvent && (
              <Link
                href={`/events/create?community=${community.id}`}
                className="text-sm text-ume-indigo font-semibold hover:underline"
              >
                Create the first one →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  )
}
