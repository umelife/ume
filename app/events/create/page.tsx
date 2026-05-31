import { redirect } from 'next/navigation'

// Event creation is disabled — announce meetups as community posts instead.
export default function CreateEventPage() {
  redirect('/communities')
}
