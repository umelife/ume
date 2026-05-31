import { redirect } from 'next/navigation'

// Events is not a live feature. Redirect event detail traffic to Communities.
export default function EventDetailPage() {
  redirect('/communities')
}
