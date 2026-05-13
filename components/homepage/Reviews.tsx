const reviews = [
  {
    name: 'Priya M.',
    school: 'UC San Diego',
    text: 'Sold my dorm furniture in two days before moving out. Way easier than Facebook Marketplace and I knew the buyer was actually a UCSD student.',
    rating: 5,
  },
  {
    name: 'Jordan K.',
    school: 'University of Michigan',
    text: 'Bought a graphing calculator for half the price of Amazon. The safe meetup feature made my parents stop worrying too.',
    rating: 5,
  },
  {
    name: 'Aisha T.',
    school: 'Howard University',
    text: 'Finally a place where I can sell textbooks to people on my campus. Got rid of 6 books in one week. Wish this existed freshman year.',
    rating: 5,
  },
  {
    name: 'Marcus R.',
    school: 'UT Austin',
    text: 'The .edu login means no random people messaging you. Everyone on here is a real student. That alone makes it worth using.',
    rating: 5,
  },
  {
    name: 'Sophie L.',
    school: 'Boston University',
    text: 'Joined a study group community through UME and ended up finding people in my major I never would have met otherwise.',
    rating: 5,
  },
  {
    name: 'Dev P.',
    school: 'Georgia Tech',
    text: 'Sold my old laptop for a fair price without having to deal with lowball offers from strangers. The chat feature makes negotiating easy.',
    rating: 5,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-ume-pink" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Reviews() {
  return (
    <section className="w-full py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-ume-pink mb-3">Student reviews</p>
          <h2 className="font-black text-3xl sm:text-4xl text-ume-indigo tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            What students are saying
          </h2>
          <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
            Real reviews from verified .edu students across the US.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-ume-cream rounded-2xl p-5 border border-gray-100 flex flex-col gap-3"
            >
              <StarRating count={r.rating} />
              <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
              <div>
                <p className="text-sm font-bold text-ume-indigo">{r.name}</p>
                <p className="text-xs text-gray-400">{r.school}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
