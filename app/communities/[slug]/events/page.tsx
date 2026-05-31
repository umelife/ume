import { redirect } from 'next/navigation'

// Per-community events are disabled — redirect back to the community.
export default async function CommunityEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/communities/${slug}`)
}
