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
  description?: string
  features?: string[]
}

export default function HomeSectionRow({
  title,
  icon,
  viewAllHref,
  children,
  comingSoon = false,
  accentColor = 'bg-ume-indigo',
  description,
  features = [],
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
          /* ── Coming Soon: full-width rich teaser ── */
          <div className="px-4 sm:px-6" aria-label={`${title} — coming soon`}>
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Soft gradient wash */}
              <div className="absolute inset-0 bg-gradient-to-br from-ume-indigo/[0.03] via-transparent to-ume-pink/[0.04] pointer-events-none" />

              {/* Large icon */}
              <div className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${accentColor} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                <div className="w-7 h-7 sm:w-8 sm:h-8">{icon}</div>
              </div>

              {/* Text content */}
              <div className="relative z-10 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
                  <h3 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-ume-indigo">
                    {title}
                  </h3>
                  <span className="text-[10px] bg-[#fa9ebc]/15 text-[#fa9ebc] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#fa9ebc]/20">
                    Coming Soon
                  </span>
                </div>

                {description && (
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg mb-4">
                    {description}
                  </p>
                )}

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {features.map(f => (
                      <span key={f} className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-3 py-1 rounded-full font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* In development pulse */}
              <div className="relative z-10 flex items-center gap-2 text-xs text-gray-400 font-medium shrink-0 self-center">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fa9ebc] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#fa9ebc]" />
                </span>
                In development
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
