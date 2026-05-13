import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import CommunitySettingsClient from './CommunitySettingsClient'
import type { Community, CommunityMember } from '@/types/database'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunitySettingsPage({ params }: Props) {
  const { slug } = await params
  const { user } = await getUser()
  if (!user) redirect(`/login?redirect=/communities/${slug}/settings`)

  const supabase = await createClient()

  const { data: community, error } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !community) notFound()

  // Only owner can access settings
  const { data: mem } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single()

  if (mem?.role !== 'owner') redirect(`/communities/${slug}`)

  // Fetch members with user info
  const { data: membersData } = await supabase
    .from('community_members')
    .select('*, user:users!user_id(id, username, display_name, avatar_url)')
    .eq('community_id', community.id)
    .order('joined_at', { ascending: true })

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/communities/${slug}`}
            className="text-sm text-ume-indigo/70 hover:text-ume-indigo font-semibold"
          >
            ← {community.name}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-600">Settings</span>
        </div>

        <CommunitySettingsClient
          community={community as Community & { rules?: string[] }}
          members={(membersData ?? []) as (CommunityMember & { user: any })[]}
        />
      </div>
    </div>
  )
}
