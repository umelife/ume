'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

interface Props {
  basePath: string
  currentState?: string
  extraParams?: Record<string, string>
}

export default function StateFilter({ basePath, currentState, extraParams = {} }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('state', e.target.value)
    else params.delete('state')
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <select
      value={currentState || ''}
      onChange={onChange}
      className="border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none"
    >
      <option value="">All states</option>
      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
