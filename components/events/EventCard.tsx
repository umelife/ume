import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { UMEEvent } from '@/types/database'

export default function EventCard({ event }: { event: UMEEvent }) {
  const start = new Date(event.starts_at)
  const dateStr = format(start, 'EEE, MMM d')
  const timeStr = format(start, 'h:mm a')
  const location = event.location_type === 'virtual'
    ? 'Virtual'
    : [event.city, event.state].filter(Boolean).join(', ') || event.location_address || 'In person'
  const cover = event.cover_image_url

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-100 hover:-translate-y-0.5"
    >
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-ume-indigo/5 to-ume-pink/10 overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-ume-indigo/20" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-xs font-bold">{dateStr} · {timeStr}</p>
        </div>
      </div>
      <div className="p-3.5 space-y-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{event.title}</h3>
        <p className="text-xs text-gray-500">{location}</p>
        <div className="flex items-center justify-between pt-1">
          {event.community && (
            <span className="text-[10px] text-ume-indigo/80 font-medium truncate">
              {event.community.name}
            </span>
          )}
          <span className="text-[10px] text-gray-400 ml-auto">
            {event.rsvp_count} going
          </span>
        </div>
      </div>
    </Link>
  )
}
