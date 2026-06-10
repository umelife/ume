import { redirect } from 'next/navigation'

// The separate student-verification step is disabled — a confirmed .edu email
// is the verification. Redirect any traffic here straight to the marketplace.
// (SheerID integration is preserved in git history and can be re-enabled by
// restoring this page and the middleware redirect.)
export default function VerifyStudentPage() {
  redirect('/marketplace')
}
