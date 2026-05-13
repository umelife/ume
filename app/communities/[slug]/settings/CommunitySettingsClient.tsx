'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRules, kickMember, promoteMember, deleteCommunity } from '@/app/communities/actions'
import type { Community, CommunityMember } from '@/types/database'

interface Props {
  community: Community & { rules?: string[] }
  members: (CommunityMember & { user: any })[]
}

export default function CommunitySettingsClient({ community, members }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Rules state
  const [rules, setRules] = useState<string[]>(community.rules ?? [])
  const [newRule, setNewRule] = useState('')

  function addRule() {
    if (!newRule.trim() || rules.length >= 20) return
    setRules([...rules, newRule.trim()])
    setNewRule('')
  }

  function removeRule(i: number) {
    setRules(rules.filter((_, idx) => idx !== i))
  }

  function saveRules() {
    setError(null); setSuccess(null)
    startTransition(async () => {
      const res = await updateRules(community.id, rules)
      if (res.error) setError(res.error)
      else { setSuccess('Rules saved.'); router.refresh() }
    })
  }

  function handleKick(userId: string, name: string) {
    if (!confirm(`Remove @${name} from this community?`)) return
    startTransition(async () => {
      const res = await kickMember(community.id, userId)
      if (res.error) setError(res.error)
      else { setSuccess(`@${name} removed.`); router.refresh() }
    })
  }

  function handlePromote(userId: string, name: string, current: string) {
    const next = current === 'moderator' ? 'member' : 'moderator'
    const label = next === 'moderator' ? `Make @${name} a moderator?` : `Remove @${name} as moderator?`
    if (!confirm(label)) return
    startTransition(async () => {
      const res = await promoteMember(community.id, userId, next as 'moderator' | 'member')
      if (res.error) setError(res.error)
      else { setSuccess('Role updated.'); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${community.name}"? This cannot be undone. All posts will be hidden.`)) return
    if (!confirm('Are you absolutely sure? Type DELETE to confirm.')) return
    startTransition(async () => {
      const res = await deleteCommunity(community.id)
      if (res.error) setError(res.error)
      else router.push('/communities')
    })
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      {/* Rules */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Community Rules</h2>
        <p className="text-xs text-gray-500">These display in the sidebar so members know what's expected.</p>

        {rules.length > 0 && (
          <ol className="space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-ume-indigo/10 text-ume-indigo text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1">{rule}</span>
                <button
                  onClick={() => removeRule(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                >×</button>
              </li>
            ))}
          </ol>
        )}

        <div className="flex gap-2">
          <input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            placeholder="Add a rule..."
            maxLength={200}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ume-indigo"
          />
          <button
            onClick={addRule}
            disabled={!newRule.trim() || rules.length >= 20}
            className="bg-ume-indigo text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-800 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>

        <button
          onClick={saveRules}
          disabled={isPending}
          className="w-full bg-ume-indigo text-white font-semibold py-2.5 rounded-full hover:bg-indigo-800 disabled:opacity-60 transition-colors text-sm"
        >
          {isPending ? 'Saving…' : 'Save rules'}
        </button>
      </section>

      {/* Members */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Members ({members.length})</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {members.map((m) => {
            const u = m.user
            const name = u?.username || u?.display_name || 'Unknown'
            return (
              <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-ume-indigo/10 flex items-center justify-center text-xs font-bold text-ume-indigo shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">@{name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
                </div>
                {m.role !== 'owner' && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handlePromote(m.user_id, name, m.role)}
                      disabled={isPending}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full border border-ume-indigo text-ume-indigo hover:bg-ume-indigo hover:text-white transition-colors disabled:opacity-50"
                    >
                      {m.role === 'moderator' ? 'Demote' : 'Mod'}
                    </button>
                    <button
                      onClick={() => handleKick(m.user_id, name)}
                      disabled={isPending}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-red-100 p-5 space-y-3">
        <h2 className="font-bold text-red-700">Danger zone</h2>
        <p className="text-xs text-gray-500">
          Deleting the community hides it from everyone and removes it from all feeds. Existing posts are archived but not permanently deleted.
        </p>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="w-full text-sm font-semibold text-red-600 border border-red-200 py-2.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Deleting…' : 'Delete community'}
        </button>
      </section>
    </div>
  )
}
