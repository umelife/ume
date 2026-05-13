import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import CreateEventForm from './CreateEventForm'

interface Props {
  searchParams: Promise<{ community?: string }>
}

export default async function CreateEventPage({ searchParams }: Props) {
  const { user } = await getUser()
  if (!user) redirect('/login?redirect=/events/create')

  const params = await searchParams
  const accountType = (user.user_metadata?.account_type ?? 'student') as 'student' | 'personal' | 'organization'

  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-black text-ume-indigo mb-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
          Create an event
        </h1>
        <p className="text-sm text-gray-500 mb-6">Events must belong to a community you own or moderate.</p>
        <CreateEventForm communityId={params.community} accountType={accountType} />
      </div>
    </div>
  )
}
