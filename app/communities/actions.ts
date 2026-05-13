'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { COMMUNITY_CATEGORY_SLUGS } from '@/data/community-categories'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireOwnerOrMod(communityId: string): Promise<{
  userId: string
  role: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: '', role: '', error: 'Not authenticated' }

  const { data: mem } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (!mem || !['owner', 'moderator'].includes(mem.role)) {
    return { userId: user.id, role: '', error: 'Must be owner or moderator' }
  }
  return { userId: user.id, role: mem.role }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export async function createCommunity(input: {
  name: string
  description: string
  category: string
  city?: string
  state?: string
  campus?: string
  is_private?: boolean
  cover_image_url?: string
}): Promise<{ id?: string; slug?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!input.name?.trim()) return { error: 'Name is required' }
  if (!input.description?.trim()) return { error: 'Description is required' }
  if (!COMMUNITY_CATEGORY_SLUGS.includes(input.category)) return { error: 'Invalid category' }

  const baseSlug = toSlug(input.name)
  if (!baseSlug) return { error: 'Invalid community name' }

  // Make slug unique
  let slug = baseSlug
  const { data: existing } = await supabase
    .from('communities')
    .select('slug')
    .ilike('slug', `${baseSlug}%`)
    .order('slug')
  if (existing?.some(r => r.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const { data, error } = await supabase
    .from('communities')
    .insert({
      creator_id: user.id,
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      category: input.category,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      campus: input.campus || null,
      is_private: input.is_private ?? false,
      cover_image_url: input.cover_image_url || null,
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }

  // Auto-join as owner
  await supabase.from('community_members').insert({
    community_id: data.id,
    user_id: user.id,
    role: 'owner',
  })

  revalidatePath('/communities')
  return { id: data.id, slug: data.slug }
}

export async function joinCommunity(communityId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('community_members').insert({
    community_id: communityId,
    user_id: user.id,
    role: 'member',
  })
  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath(`/communities`)
  return {}
}

export async function leaveCommunity(communityId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .neq('role', 'owner')

  if (error) return { error: error.message }
  revalidatePath(`/communities`)
  return {}
}

export async function createPost(input: {
  community_id: string
  type: 'text' | 'image' | 'link'
  title: string
  body?: string
  image_urls?: string[]
  link_url?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!input.title?.trim()) return { error: 'Title is required' }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      community_id: input.community_id,
      author_id: user.id,
      type: input.type,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      image_urls: input.image_urls ?? [],
      link_url: input.link_url?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/communities`)
  return { id: data.id }
}

export async function votePost(postId: string, voted: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (voted) {
    await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id)
  } else {
    const { error } = await supabase.from('post_votes').insert({ post_id: postId, user_id: user.id })
    if (error && error.code !== '23505') return { error: error.message }
  }
  return {}
}

export async function createComment(input: {
  post_id: string
  body: string
  parent_id?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!input.body?.trim()) return { error: 'Comment cannot be empty' }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: input.post_id,
      author_id: user.id,
      body: input.body.trim(),
      parent_id: input.parent_id || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

// ── Moderation ────────────────────────────────────────────────────────────────

export async function deletePost(
  postId: string,
  communityId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Allow: post author OR community owner/mod
  const { data: post } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', postId)
    .single()
  if (!post) return { error: 'Post not found' }

  const isAuthor = post.author_id === user.id
  if (!isAuthor) {
    const { error: permErr } = await (async () => {
      const r = await requireOwnerOrMod(communityId)
      return { error: r.error }
    })()
    if (permErr) return { error: 'Not authorized to delete this post' }
  }

  // Use service client to bypass RLS (which only allows author-delete)
  const service = await createServiceClient()
  const { error } = await service.from('community_posts').delete().eq('id', postId)
  if (error) return { error: error.message }

  revalidatePath(`/communities`)
  return {}
}

export async function updateRules(
  communityId: string,
  rules: string[],
): Promise<{ error?: string }> {
  const { error: permErr } = await requireOwnerOrMod(communityId)
  if (permErr) return { error: permErr }

  const supabase = await createClient()
  const clean = rules.map(r => r.trim()).filter(Boolean).slice(0, 20)
  const { error } = await supabase
    .from('communities')
    .update({ rules: clean })
    .eq('id', communityId)
  if (error) return { error: error.message }

  revalidatePath(`/communities`)
  return {}
}

export async function kickMember(
  communityId: string,
  userId: string,
): Promise<{ error?: string }> {
  const { userId: actorId, error: permErr } = await requireOwnerOrMod(communityId)
  if (permErr) return { error: permErr }
  if (userId === actorId) return { error: "Can't remove yourself" }

  // Can't kick another owner
  const supabase = await createClient()
  const { data: target } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()
  if (target?.role === 'owner') return { error: "Can't remove the owner" }

  const service = await createServiceClient()
  const { error } = await service
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)
  if (error) return { error: error.message }

  revalidatePath(`/communities`)
  return {}
}

export async function promoteMember(
  communityId: string,
  userId: string,
  role: 'moderator' | 'member',
): Promise<{ error?: string }> {
  const { error: permErr, role: actorRole } = await requireOwnerOrMod(communityId)
  if (permErr) return { error: permErr }
  if (actorRole !== 'owner') return { error: 'Only the owner can change roles' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .update({ role })
    .eq('community_id', communityId)
    .eq('user_id', userId)
  if (error) return { error: error.message }

  revalidatePath(`/communities`)
  return {}
}

export async function deleteCommunity(
  communityId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Only owner can delete
  const { data: mem } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()
  if (mem?.role !== 'owner') return { error: 'Only the community owner can delete it' }

  // Soft-delete (archive) — preserves posts for moderation audit
  const { error } = await supabase
    .from('communities')
    .update({ status: 'archived' })
    .eq('id', communityId)
  if (error) return { error: error.message }

  revalidatePath('/communities')
  return {}
}
