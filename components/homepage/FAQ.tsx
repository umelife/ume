'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'What is UME and who can use it?',
    a: 'UME is a campus marketplace and community platform built exclusively for college students. Only people with a verified .edu email address can sign up — no outside buyers, no strangers from the internet. Just real students from your campus.',
  },
  {
    q: 'Is UME free to use?',
    a: 'Yes, UME is completely free to sign up and browse. Listing an item costs nothing. We currently charge no commission on sales, so you keep 100% of what you earn.',
  },
  {
    q: 'How do I know the buyer or seller is a real student?',
    a: 'Every user on UME has verified their .edu email address during signup. This means every person you interact with is enrolled at an accredited US college or university — not a random person off the internet.',
  },
  {
    q: 'Is it safe to meet someone from UME in person?',
    a: 'Yes. UME has a built-in Safe-Handshake system — a GPS-verified meetup feature that guides both parties to a campus Blue Light safety station. A one-time QR code confirms the exchange, and payment is only released once both parties arrive. You never have to meet a stranger off-campus.',
  },
  {
    q: 'What can I sell on UME?',
    a: 'You can sell textbooks, electronics, dorm furniture, clothing, bikes, sports gear, school supplies, and more. UME supports both in-person campus meetups and shipping for buyers on different campuses.',
  },
  {
    q: 'How does payment work?',
    a: 'UME supports Stripe payments with buyer protection built in. For in-person meetups, your card is authorized but only charged once the QR code is scanned at the meetup — acting as an escrow. For shipped items, payment is processed immediately and EasyPost generates a real shipping label.',
  },
  {
    q: 'What are Communities on UME?',
    a: 'Communities are student-run groups on UME for any interest — study groups, sports teams, Greek life, gaming, fitness, and more. You can post, vote, comment, and join communities from any campus across the US.',
  },
  {
    q: 'Can I find events near me on UME?',
    a: 'Yes. UME has a live Events section where students and organizations can post campus meetups, study sessions, parties, and more. You can filter by state or search by keyword to find events near you — even during summer.',
  },
  {
    q: 'What if I have a problem with a buyer or seller?',
    a: 'You can report any listing or user directly from the app. Our moderation team reviews every report. For payment disputes on Stripe transactions, UME offers buyer protection — if a seller does not ship within 3 days of payment, you can request a full refund.',
  },
  {
    q: 'How is UME different from Facebook Marketplace or Craigslist?',
    a: 'Facebook Marketplace and Craigslist are open to anyone. UME is only for verified students. That means safer meetups, more relevant listings, and a community of people who go to the same school as you. We also built campus-specific features — Safe-Handshake meetups, .edu-only communities, and semester-timed events — that general marketplaces will never build.',
  },
]

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="text-sm sm:text-base font-semibold text-ume-indigo group-hover:text-ume-pink transition-colors">
          {q}
        </span>
        <span className={`shrink-0 w-6 h-6 rounded-full border-2 border-ume-indigo flex items-center justify-center transition-transform duration-200 ${open ? 'rotate-45 border-ume-pink' : ''}`}>
          <svg className={`w-3 h-3 ${open ? 'text-ume-pink' : 'text-ume-indigo'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="text-sm text-gray-600 leading-relaxed pb-4 pr-10">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section className="w-full py-16 sm:py-20 bg-ume-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-ume-pink mb-3">Got questions?</p>
          <h2 className="font-black text-3xl sm:text-4xl text-ume-indigo tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Frequently asked questions
          </h2>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 sm:px-8">
          {faqs.map((f, i) => <Item key={i} q={f.q} a={f.a} />)}
        </div>
      </div>
    </section>
  )
}
