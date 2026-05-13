import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import CreateCommunityForm from './CreateCommunityForm'

export default async function CreateCommunityPage() {
  const { user } = await getUser()
  if (!user) redirect('/login?redirect=/communities/create')
  return (
    <div className="min-h-screen bg-ume-bg pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-black text-ume-indigo mb-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
          Start a community
        </h1>
        <p className="text-sm text-gray-500 mb-6">Free to create. Open to everyone on UME.</p>
        <CreateCommunityForm />
      </div>
    </div>
  )
}
