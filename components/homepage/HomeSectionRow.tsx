/**
 * HomeSectionRow
 * Reusable horizontal-scroll section used on the homepage for
 * Marketplace, Services, Communities, and Events.
 *
 * Props:
 *  - title: section heading
 *  - icon: SVG ReactNode shown next to the title
 *  - viewAllHref: href for the "View All" link
 *  - children: the cards to render inside the scroll row (live sections only)
 *  - comingSoon: if true, renders a polished "Coming Soon" placeholder
 *  - accentColor: Tailwind bg class for the icon badge (default ume-indigo)
 */

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface HomeSectionRowProps {
  title: string
  icon: React.ReactNode
  viewAllHref: string
  children?: React.ReactNode
  comingSoon?: boolean
  accentColor?: string
}

export default function HomeSectionRow({
  title,
  icon,
  viewAllHref,
  children,
  comingSoon = false,
  accentColor = 'bg-ume-indigo',
}: HomeSectionRowProps) {
  return (
    <section className="w-full py-6 sm:py-8 bg-ume-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 mb-1">
          <div className="flex items-center gap-2.5">
            {/* Icon badge */}
            <div
              className={`w-8 h-8 rounded-lg ${accentColor} flex items-center justify-center text-white shrink-0`}
            >
              {icon}
            </div>

            <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-[#130170]">
              {title}
            </h2>

            {comingSoon && (
              <Badge className="bg-[#fa9ebc]/15 text-[#fa9ebc] border-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Coming Soon
              </Badge>
            )}
          </div>

          {!comingSoon && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-sm text-[#fa9ebc] font-semibold hover:underline underline-offset-2 shrink-0 transition-colors hover:text-[#fa9ebc]/80"
            >
              View All
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          )}
        </div>

        {/* Separator under header */}
        <Separator className="mx-4 sm:mx-6 mb-4 bg-[#130170]/8 w-auto" />

        {comingSoon ? (
          /* ── Coming Soon: skeleton strip + prominent teaser card ── */
          <div className="px-4 sm:px-6" aria-label={`${title} — coming soon`}>
            {/* Skeleton card strip */}
            <div
              className="flex gap-3 overflow-x-hidden pb-3 pointer-events-none select-none"
              style={{
                maskImage:
                  'linear-gradient(to right, black 0%, black 60%, transparent 100%)',
              }}
              aria-hidden="true"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-48 opacity-50">
                  <div className="w-full aspect-square rounded-2xl mb-2.5 bg-gradient-to-br from-gray-200 to-gray-100" />
                  <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                </div>
              ))}
            </div>

            {/* Teaser card */}
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mt-1">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fa9ebc] opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fa9ebc]" />
              </span>
              <div className="min-w-0">
                <p className="font-black text-[#130170] text-sm uppercase tracking-tight">
                  {title} is coming to UME
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  We&apos;re building it. Stay tuned.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Live: horizontal scroll row ── */
          <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-3 scroll-smooth scrollbar-hide">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
