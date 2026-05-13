import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
// CommentsSection handles all comment interactivity including replies
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { formatDistanceToNow } from 'date-fns'
import type { PostComment } from '@/types/database'
import PostVoteButton from './PostVoteButton'
import CommentsSection from './CommentsSection'

interface Props { params: Promise<{ slug: string; id: string }> }

export default async function PostDetailPage({ params }: Props) {
  const { slug, id } = await params
  const supabase = await createClient()
  const { user } = await getUser()

  const { data: postData, error } = await supabase
    .from('community_posts')
    .select('*, author:users!author_id(id, username, display_name, avatar_url), community:communities!community_id(id, name, slug)')
    .eq('id', id)
    .single()

  if (error || !postData) notFound()
  if ((postData.community as any)?.slug !== slug) notFound()

  const { data: commentsData } = await supabase
    .from('post_comments')
    .select('*, author:users!author_id(id, username, display_name, avatar_url)')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  let hasVoted = false
  if (user) {
    const { data: vote } = await supabase
      .from('post_votes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    hasVoted = !!vote
  }

  // Nest replies under top-level comments
  const topLevel: PostComment[] = []
  const replyMap: Record<string, PostComment[]> = {}
  for (const c of commentsData ?? []) {
    if (c.parent_id) {
      replyMap[c.parent_id] = replyMap[c.parent_id] ?? []
      replyMap[c.parent_id].push(c as PostComment)
    } else {
      topLevel.push(c as PostComment)
    }
  }

  const communityName = (postData.community as any)?.name ?? 'Community'

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href={`/communities/${slug}`}
          className="text-sm text-ume-indigo/70 hover:text-ume-indigo font-semibold inline-flex items-center gap-1 mb-4"
        >
          ← {communityName}
        </Link>

        {/* Post */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="p-5 sm:p-6">
            <div className="flex gap-4">
              <PostVoteButton
                postId={id}
                initialVotes={postData.upvote_count}
                initialVoted={hasVoted}
                isLoggedIn={!!user}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-2">
                  <span className="font-semibold text-gray-600">
                    @{postData.author?.username || postData.author?.display_name}
                  </span>
                  {' · '}
                  {formatDistanceToNow(new Date(postData.created_at), { addSuffix: true })}
                </p>
                <h1
                  className="text-xl font-black text-gray-900 mb-3"
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                >
                  {postData.title}
                </h1>
                {postData.body && (
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                    {postData.body}
                  </p>
                )}
                {postData.type === 'image' && postData.image_urls?.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {postData.image_urls.map((url: string, i: number) => (
                      <div key={i} className="relative w-full rounded-2xl overflow-hidden">
                        <Image src={url} alt="" width={600} height={400} unoptimized className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {postData.type === 'link' && postData.link_url && (
                  <a
                    href={postData.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-ume-indigo hover:underline mb-3"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="truncate">{postData.link_url}</span>
                  </a>
                )}
                <p className="text-[10px] text-gray-400">
                  {postData.comment_count} {postData.comment_count === 1 ? 'comment' : 'comments'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentsSection
          postId={id}
          topLevel={topLevel}
          replyMap={replyMap}
          isLoggedIn={!!user}
          communitySlug={slug}
        />
      </div>
    </div>
  )
}

