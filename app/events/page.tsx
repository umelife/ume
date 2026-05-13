import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/events/EventCard'
import StateFilter from '@/components/communities/StateFilter'
import type { UMEEvent } from '@/types/database'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover student events and meetups across the US — on campus and at home.',
  alternates: { canonical: '/events' },
}

interface PageProps {
  searchParams: Promise<{ state?: string; q?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, community:communities(name, slug, cover_image_url)')
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(40)

  if (params.state) query = query.eq('state', params.state)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data } = await query
  const events = (data ?? []) as UMEEvent[]


  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="bg-gradient-to-br from-ume-indigo via-purple-700 to-ume-pink/70 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            EVENTS
          </h1>
          <p className="mt-2 text-white/80 text-sm sm:text-base max-w-md">
            Student meetups, study sessions, and hangouts — anywhere in the US.
          </p>
          <form method="get" className="mt-6 flex gap-2 max-w-lg">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search events..."
              className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-white/20"
            />
            {params.state && <input type="hidden" name="state" value={params.state} />}
            <button type="submit" className="bg-white text-ume-indigo font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white/90 transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto">
          <Link
            href="/events"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              !params.state ? 'bg-ume-indigo text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All states
          </Link>
          <StateFilter basePath="/events" currentState={params.state} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-base">No upcoming events.{' '}
              <Link href="/communities" className="text-ume-indigo font-semibold">Browse communities →</Link>
            </p>
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
