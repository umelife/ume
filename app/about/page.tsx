import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About UME — The Student Marketplace Built For Students',
  description:
    'UME was built by students, for students. Learn how Ruthiik and Bryndis created a verified campus marketplace to make buying and selling on campus safe, affordable, and sustainable.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About UME — The Student Marketplace Built For Students',
    description:
      'Learn how two university students built UME to make campus buying and selling safe, affordable, and sustainable.',
    url: '/about',
    images: [{ url: '/about-founders.jpg', width: 800, height: 800, alt: 'UME Founders' }],
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ume-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'AboutPage',
              name: 'About UME',
              description:
                'UME is a verified student marketplace where college students can buy and sell textbooks, dorm items, tech, clothing, and more exclusively within their campus community.',
              url: 'https://ume-life.com/about',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Ruthiik',
              jobTitle: 'Co-founder',
              worksFor: { '@type': 'Organization', name: 'UME' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Bryndis',
              jobTitle: 'Co-founder',
              worksFor: { '@type': 'Organization', name: 'UME' },
            },
          ]),
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* What's UME? - Centered Section */}
        <div className="text-center mb-20">
          <h1 className="heading-primary mb-8">
            WHAT'S <span className="text-ume-indigo">U</span><span className="text-ume-pink">M</span><span className="text-ume-pink">E</span>?
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-black leading-relaxed mb-4">
              We're two university students, Ruthiik and Bryndis, who kept running into the same problem — it was always a hassle to buy or sell things safely on campus. From textbooks to dorm furniture, everything felt scattered or overpriced. So, we decided to build the solution we wished existed: a marketplace just for students.
            </p>
            <p className="text-lg text-black leading-relaxed mb-4">
              Every user is verified through their university email, ensuring a safe and local experience.
            </p>
            <p className="text-lg text-black leading-relaxed font-semibold">
              Our mission is simple — make campus life more affordable, sustainable, and connected.
            </p>
          </div>
        </div>

        {/* Our Values Section - Picture + Text */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Founders Picture - left side */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <Image
                src="/about-founders.jpg"
                alt="UME Founders"
                fill
                className="object-cover"
              />
            </div>

            {/* Our Values Text - right side */}
            <div>
              <h2 className="heading-primary mb-6" style={{ fontSize: '2rem' }}>
                OUR VALUES
              </h2>
              <div className="space-y-4 text-lg text-black leading-relaxed">
                <p>We believe in trust, sustainability, and community.</p>
                <p>Every trade should feel safe, fair, and student-first.</p>
                <p>By keeping items in use and on campus, we help each other — and the planet.</p>
              </div>
            </div>
          </div>
        </div>

        {/* For Students, By Students Section */}
        <div className="text-center mb-12">
          <h2 className="heading-primary mb-12">
            FOR STUDENTS, BY STUDENTS
          </h2>

          {/* Three Pillars with Images */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Affordable */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src="/about-affordable.jpg"
                  alt="Affordable"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Affordable</h3>
            </div>

            {/* Connected */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src="/about-connected.jpg"
                  alt="Connected"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Connected</h3>
            </div>

            {/* Sustainable */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src="/about-sustainable.jpg"
                  alt="Sustainable"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Sustainable</h3>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
