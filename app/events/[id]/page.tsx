import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import EventRsvpButtons from './EventRsvpButtons'
import CancelEventButton from './CancelEventButton'
import { format } from 'date-fns'
import type { UMEEvent } from '@/types/database'

interface Props { params: Promise<{ id: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { user } = await getUser()

  const { data: event, error } = await supabase
    .from('events')
    .select('*, community:communities(id, name, slug, cover_image_url), creator:users(*)')
    .eq('id', id)
    .single()

  if (error || !event) notFound()
  const e = event as UMEEvent

  const start = new Date(e.starts_at)
  const end = e.ends_at ? new Date(e.ends_at) : null

  const location = e.location_type === 'virtual'
    ? 'Virtual event'
    : [e.location_address, e.city, e.state].filter(Boolean).join(', ')

  let rsvpStatus: 'going' | 'interested' | null = null
  if (user) {
    const { data: rsvp } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    rsvpStatus = (rsvp?.status as typeof rsvpStatus) ?? null
  }

  const spotsLeft = e.max_attendees ? e.max_attendees - e.rsvp_count : null
  const isCreator = user?.id === e.creator_id

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/events" className="text-sm text-ume-indigo/70 hover:text-ume-indigo font-semibold inline-flex items-center gap-1 mb-4">
          ← Events
        </Link>

        {/* Cover */}
        <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-gradient-to-br from-ume-indigo/10 to-ume-pink/10 shadow-md mb-6">
          {e.cover_image_url ? (
            <Image src={e.cover_image_url} alt={e.title} fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-ume-indigo/20" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
              </svg>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Title + community */}
            <div>
              {e.community && (
                <Link
                  href={`/communities/${(e.community as any).slug}`}
                  className="text-xs text-ume-indigo font-semibold hover:underline"
                >
                  {(e.community as any).name}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                {e.title}
              </h1>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail icon="📅" label="When">
                {format(start, 'EEEE, MMMM d, yyyy')}
                <br />
                {format(start, 'h:mm a')}{end ? ` – ${format(end, 'h:mm a')}` : ''}
              </Detail>
              <Detail icon="📍" label="Where">
                {location || 'Location TBD'}
              </Detail>
              <Detail icon="👥" label="Attendance">
                {e.rsvp_count} going
                {spotsLeft !== null && ` · ${Math.max(0, spotsLeft)} spots left`}
              </Detail>
              <Detail icon="👤" label="Hosted by">
                @{e.creator?.username || e.creator?.display_name}
              </Detail>
            </div>

            {/* RSVP */}
            {e.status === 'scheduled' && (
              user ? (
                <EventRsvpButtons eventId={id} initialStatus={rsvpStatus} isFull={spotsLeft === 0} />
              ) : (
                <Link
                  href={`/login?redirect=/events/${id}`}
                  className="block w-full text-center bg-ume-indigo text-white font-semibold py-3 rounded-full hover:bg-indigo-800 transition-colors"
                >
                  Sign in to RSVP
                </Link>
              )
            )}

            {e.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center font-semibold">
                This event has been cancelled
              </div>
            )}

            {isCreator && e.status === 'scheduled' && (
              <CancelEventButton eventId={id} />
            )}

            {/* Description */}
            {e.description && (
              <div className="border-t border-gray-100 pt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-2">About this event</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{e.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{children}</p>
      </div>
    </div>
  )
}
