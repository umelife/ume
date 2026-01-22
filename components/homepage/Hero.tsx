/**
 * Hero Component
 *
 * Split-layout hero section matching the UME design:
 * - Left side: Dark indigo background with headline and CTA
 * - Right side: Full-height image of students
 */

import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  /** Background image URL for right side */
  backgroundImage?: string
  /** Subtitle text */
  subtitle?: string
  /** CTA button text */
  ctaText?: string
  /** CTA button destination */
  ctaHref?: string
}

export default function Hero({
  backgroundImage = '/placeholders/hero-city.jpg',
  subtitle = 'For students, by students',
  ctaText = 'Browse Marketplace',
  ctaHref = '/marketplace'
}: HeroProps) {
  return (
    <section className="relative w-full h-[calc(100vh-80px)] min-h-[500px] flex">
      {/* Left Side - Dark Indigo Background with Text */}
      <div className="w-full md:w-[40%] lg:w-[35%] bg-ume-indigo flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 relative z-10">
        {/* Headline */}
        <h1 className="text-left mb-2">
          <span className="block text-white font-black text-3xl sm:text-4xl md:text-4xl lg:text-5xl uppercase tracking-tight leading-tight">
            YOUR UNIVERSITY
          </span>
          <span className="block text-ume-pink font-black text-3xl sm:text-4xl md:text-4xl lg:text-5xl uppercase tracking-tight leading-tight">
            MARKETPLACE
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-sm md:text-base font-light mb-8">
          {subtitle}
        </p>

        {/* CTA Button - Cream/white with rounded corners */}
        <Link
          href={ctaHref}
          className="inline-block w-fit px-8 py-3 bg-ume-cream text-ume-indigo font-semibold text-sm rounded-full hover:bg-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
        >
          {ctaText}
        </Link>
      </div>

      {/* Right Side - Image */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] relative">
        <Image
          src={backgroundImage}
          alt="Students collaborating"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
      </div>

      {/* Mobile: Background image behind the content */}
      <div className="absolute inset-0 md:hidden -z-10">
        <Image
          src={backgroundImage}
          alt="Students collaborating"
          fill
          className="object-cover object-right opacity-30"
          priority
          quality={90}
        />
      </div>
    </section>
  )
}
