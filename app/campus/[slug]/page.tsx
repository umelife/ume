import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { COLLEGES, getCollegeBySlug } from '@/data/colleges'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return COLLEGES.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const college = getCollegeBySlug(slug)
  if (!college) return {}
  return {
    title: `${college.name} Student Marketplace — Buy & Sell on Campus | UME`,
    description: `Buy and sell textbooks, furniture, electronics, and more with verified ${college.name} students. Free, .edu-only, safe campus meetups. Join UME at ${college.shortName}.`,
    alternates: { canonical: `/campus/${slug}` },
    openGraph: {
      title: `${college.shortName} Student Marketplace — UME`,
      description: `The verified student marketplace for ${college.name}. Sell your stuff before you move out. Buy from people on your campus.`,
    },
  }
}

const categories = [
  { label: 'Textbooks', icon: '📚' },
  { label: 'Electronics', icon: '💻' },
  { label: 'Dorm Furniture', icon: '🛋️' },
  { label: 'Clothing', icon: '👗' },
  { label: 'Bikes & Transport', icon: '🚲' },
  { label: 'Sports & Fitness', icon: '⚽' },
]

const steps = [
  { n: '1', title: 'Sign up with your .edu email', body: 'Only verified students can join. No strangers, no bots — just real people from your campus.' },
  { n: '2', title: 'List or browse in seconds', body: 'Post what you\'re selling with a photo and price. Or browse what\'s available on your campus right now.' },
  { n: '3', title: 'Meet safely on campus', body: 'UME\'s Safe-Handshake guides you to a campus Blue Light station. QR code confirms the exchange. Stay safe.' },
]

export default async function CampusPage({ params }: Props) {
  const { slug } = await params
  const college = getCollegeBySlug(slug)
  if (!college) notFound()

  return (
    <div className="min-h-screen bg-ume-bg">

      {/* Hero */}
      <section className="bg-gradient-to-br from-ume-indigo via-indigo-800 to-purple-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-widest text-ume-pink mb-4">
            {college.city}, {college.state}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-5" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            The student marketplace<br />
            <span className="text-ume-pink">for {college.shortName}</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mb-8 leading-relaxed">
            Buy and sell textbooks, furniture, electronics, and more with verified {college.name} students — for free, safely, on campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-ume-pink text-white font-bold text-base px-8 py-4 rounded-full hover:bg-pink-500 transition-colors shadow-lg"
            >
              Join free with your .edu email →
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white font-semibold text-base px-8 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              Browse listings
            </Link>
          </div>
          <p className="text-white/40 text-xs mt-5">
            Only .edu emails · Completely free · {college.students.toLocaleString()}+ potential buyers at {college.name}
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-black text-ume-indigo mb-2" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
          What {college.shortName} students are buying and selling
        </h2>
        <p className="text-gray-500 text-sm mb-8">From move-in to move-out — everything a college student needs.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map(c => (
            <Link
              key={c.label}
              href={`/marketplace?q=${encodeURIComponent(c.label)}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3 hover:border-ume-indigo hover:shadow-md transition-all group"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="font-semibold text-ume-indigo text-sm group-hover:text-ume-pink transition-colors">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-ume-indigo mb-8 text-center" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            How UME works at {college.shortName}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map(s => (
              <div key={s.n} className="rounded-2xl bg-ume-cream border border-gray-100 p-6">
                <div className="w-9 h-9 rounded-full bg-ume-indigo text-white font-black text-sm flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-ume-indigo mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why UME */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-black text-ume-indigo mb-6" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
          Why {college.shortName} students choose UME over Facebook Marketplace
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['Only verified .edu students', 'Everyone on UME has verified their college email. No random people, no scammers — just real students from your campus.'],
            ['Safe campus meetups built in', 'Our Safe-Handshake system guides both parties to a campus safety station. Your card is only charged when the QR code is scanned.'],
            ['Campus communities & events', 'Join study groups, find campus events, and connect with students in your major — not just people selling stuff.'],
            ['Ship across campuses', 'Selling to someone at another school? UME integrates with USPS, UPS, and FedEx for real shipping rates and label generation.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-ume-pink shrink-0 mt-0.5 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-ume-indigo text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ume-indigo text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Ready to sell at {college.shortName}?
          </h2>
          <p className="text-white/70 mb-8">
            Join free with your {college.domain ?? `.edu`} email. Takes 30 seconds.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-ume-pink text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-pink-500 transition-colors shadow-lg"
          >
            Get started free →
          </Link>
        </div>
      </section>

    </div>
  )
}
