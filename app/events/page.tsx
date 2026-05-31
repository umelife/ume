import { redirect } from 'next/navigation'

// Events is not a live feature. Students announce meetups as community posts;
// redirect any /events traffic to Communities. (Reversible — see git history.)
export default function EventsPage() {
  redirect('/communities')
}
