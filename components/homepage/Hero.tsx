import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  backgroundImage?: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
}

export default function Hero({
  backgroundImage = '/placeholders/hero-city.jpg',
  subtitle = 'For students, by students',
  ctaText = 'Browse Marketplace',
  ctaHref = '/marketplace'
}: HeroProps) {
  return (
    <>
      {/* ── Mobile Hero — stacked: photo top, indigo panel below ── */}
      <section className="md:hidden">
        <div className="relative w-full h-[240px]">
          <Image
            src={backgroundImage}
            alt="Students collaborating"
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
          />
        </div>

        <div className="bg-ume-indigo px-6 pt-7 pb-8">
          <h1 className="text-left mb-2">
            <span
              className="block text-white font-black text-4xl uppercase tracking-tight leading-tight animate-slide-up"
              style={{ animationDelay: '0ms' }}
            >
              YOUR UNIVERSITY
            </span>
            <span
              className="block text-ume-pink font-black text-4xl uppercase tracking-tight leading-tight animate-slide-up"
              style={{ animationDelay: '80ms' }}
            >
              MARKETPLACE
            </span>
          </h1>

          <p
            className="text-white/80 text-sm mb-6 animate-slide-up"
            style={{ animationDelay: '160ms' }}
          >
            {subtitle}
          </p>

          <Link
            href={ctaHref}
            className="inline-block w-fit px-8 py-3 bg-ume-cream text-ume-indigo font-semibold text-sm rounded-full hover:bg-white active:scale-[0.97] transition-[colors,transform] duration-150 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            {ctaText}
          </Link>
        </div>
      </section>

      {/* ── Desktop Hero — split: indigo left, image right ── */}
      <section className="hidden md:flex relative w-full h-[calc(100vh-80px)] min-h-[500px]">
        <div className="md:w-[40%] lg:w-[35%] bg-ume-indigo flex flex-col justify-center px-12 lg:px-16 py-12 relative z-10">
          <h1 className="text-left mb-2">
            <span
              className="block text-white font-black text-4xl lg:text-5xl xl:text-6xl uppercase tracking-tight leading-tight animate-slide-up"
              style={{ animationDelay: '0ms' }}
            >
              YOUR UNIVERSITY
            </span>
            <span
              className="block text-ume-pink font-black text-4xl lg:text-5xl xl:text-6xl uppercase tracking-tight leading-tight animate-slide-up"
              style={{ animationDelay: '80ms' }}
            >
              MARKETPLACE
            </span>
          </h1>

          <p
            className="text-white/80 text-base font-light mb-8 animate-slide-up"
            style={{ animationDelay: '160ms' }}
          >
            {subtitle}
          </p>

          <Link
            href={ctaHref}
            className="inline-block w-fit px-8 py-3 bg-ume-cream text-ume-indigo font-semibold text-sm rounded-full hover:bg-white active:scale-[0.97] transition-[colors,transform] duration-150 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            {ctaText}
          </Link>
        </div>

        <div className="md:w-[60%] lg:w-[65%] relative">
          <Image
            src={backgroundImage}
            alt="Students collaborating"
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="(min-width: 1024px) 65vw, 60vw"
          />
        </div>
      </section>
    </>
  )
}
