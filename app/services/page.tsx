export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-ume-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-4">
        <svg className="w-14 h-14 text-ume-indigo mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black text-ume-indigo mb-3" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
        Services
      </h1>
      <span className="inline-block bg-ume-pink text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
        Coming Soon
      </span>
      <p className="text-gray-500 text-sm max-w-xs">
        Offer tutoring, repairs, rides, and more to your campus community. We&apos;re building this — stay tuned!
      </p>
    </div>
  )
}
