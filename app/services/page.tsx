import { redirect } from 'next/navigation'

// Services isn't a live feature yet. Redirect to the homepage rather than
// showing a "coming soon" placeholder.
export default function ServicesPage() {
  redirect('/')
}
