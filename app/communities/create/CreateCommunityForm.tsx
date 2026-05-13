'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCommunity } from '@/app/communities/actions'
import { COMMUNITY_CATEGORIES } from '@/data/community-categories'
import { CAMPUSES } from '@/data/safe-points'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function CreateCommunityForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0].slug)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [audience, setAudience] = useState<'national' | 'campus'>('national')
  const [campus, setCampus] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        category,
        city: city.trim() || undefined,
        state: state || undefined,
        campus: audience === 'campus' ? campus : undefined,
      })
      if (res.error) { setError(res.error); return }
      router.push(`/communities/${res.slug}`)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Community name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Pre-Med Society"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  category === c.slug ? 'bg-ume-indigo text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{c.emoji}</span><span>{c.display}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="What's this community about?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ume-indigo"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Audience</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAudience('national')}
              className={`px-3 py-3 rounded-xl text-xs font-semibold border transition-colors text-left ${
                audience === 'national' ? 'border-ume-indigo bg-ume-indigo/5 text-ume-indigo' : 'border-gray-200 text-gray-600'
              }`}
            >
              <div className="font-bold mb-0.5">🌎 Everyone</div>
              <div className="text-[10px] opacity-70 font-normal">Visible across all of UME</div>
            </button>
            <button
              type="button"
              onClick={() => setAudience('campus')}
              className={`px-3 py-3 rounded-xl text-xs font-semibold border transition-colors text-left ${
                audience === 'campus' ? 'border-ume-indigo bg-ume-indigo/5 text-ume-indigo' : 'border-gray-200 text-gray-600'
              }`}
            >
              <div className="font-bold mb-0.5">🎓 Campus club</div>
              <div className="text-[10px] opacity-70 font-normal">Tagged to a specific school</div>
            </button>
          </div>
          {audience === 'campus' && (
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
            >
              <option value="">Select campus</option>
              {CAMPUSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {audience === 'national' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Nashville"
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
                <option value="">Select state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <button
        type="submit"
        disabled={isPending || !name.trim() || !description.trim()}
        className="w-full bg-ume-indigo text-white font-semibold py-3.5 rounded-full hover:bg-indigo-800 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Creating…' : 'Create community'}
      </button>
    </form>
  )
}
