'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/app/events/actions'
import EventPaywall from '@/components/payments/EventPaywall'

interface Props {
  communityId?: string
  accountType: 'student' | 'personal' | 'organization'
}

export default function CreateEventForm({ communityId, accountType }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [pendingEventId, setPendingEventId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [locationType, setLocationType] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person')
  const [locationAddress, setLocationAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createEvent({
        community_id: communityId ?? '',
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: startsAt,
        ends_at: endsAt || undefined,
        location_type: locationType,
        location_address: locationAddress.trim() || undefined,
        city: city.trim() || undefined,
        state: state || undefined,
        max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      })
      if (res.error && !res.requiresPayment) { setError(res.error); return }
      if (res.requiresPayment) {
        setPendingEventId(res.id ?? null)
        setShowPaywall(true)
        return
      }
      router.push(`/events/${res.id}`)
    })
  }

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  return (
    <>
      <form onSubmit={submit} className="space-y-5">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Event title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="MCAT Study Jam"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What can attendees expect?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ume-indigo"
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">End (optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                min={startsAt}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['in_person', 'virtual', 'hybrid'] as const).map(lt => (
              <button
                key={lt}
                type="button"
                onClick={() => setLocationType(lt)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  locationType === lt ? 'border-ume-indigo bg-ume-indigo/5 text-ume-indigo' : 'border-gray-200 text-gray-600'
                }`}
              >
                {lt === 'in_person' && 'In person'}
                {lt === 'virtual' && 'Virtual'}
                {lt === 'hybrid' && 'Hybrid'}
              </button>
            ))}
          </div>

          {locationType !== 'virtual' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Address</label>
                <input
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Hagan Library, Room 204"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Williamsburg"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Max attendees (optional)</label>
            <input
              type="number"
              min="2"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
            />
          </div>
        </section>

        {!communityId && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
            Events must belong to a community. Go to a community you own and click "+ New event" from there.
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <button
          type="submit"
          disabled={isPending || !title.trim() || !startsAt || !communityId}
          className="w-full bg-ume-indigo text-white font-semibold py-3.5 rounded-full hover:bg-indigo-800 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Creating…' : 'Create event'}
        </button>
      </form>

      {showPaywall && (
        <EventPaywall
          accountType={accountType}
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false)
            if (pendingEventId) router.push(`/events/${pendingEventId}`)
          }}
        />
      )}
    </>
  )
}
