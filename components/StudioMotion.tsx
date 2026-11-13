'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/** Content stays visible without JavaScript or motion support. */
export default function StudioMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{ opacity: 0.35, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none' })
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    root.querySelectorAll('section').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [pathname])
  return <div key={pathname} ref={ref} className="studio-content" data-route={pathname.split('/')[1] || 'home'}>{children}</div>
}
