/**
 * VerifiedBadge — a small "verified student" check shown next to a handle.
 * UME is student-only and every account is gated behind a confirmed .edu
 * email, so this is the trust marker that says "a real, verified student."
 */
export default function VerifiedBadge({
  className = '',
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  return (
    <span
      title="Verified student"
      aria-label="Verified student"
      className={`inline-flex items-center gap-1 align-middle ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
        <path
          fill="#130170"
          d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.7-1.1 3 1.1 3-2.7 1.7-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3L2.5 16l1.1-3-1.1-3 2.7-1.7 1-3 3.2.2L12 1.5z"
        />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.5 12.2l2.3 2.3 4.7-4.9"
        />
      </svg>
      {showLabel && (
        <span className="text-xs font-semibold text-ume-indigo">Verified student</span>
      )}
    </span>
  )
}
