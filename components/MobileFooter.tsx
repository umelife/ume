import Link from 'next/link'

export default function MobileFooter() {
  return (
    <footer className="md:hidden bg-white border-t border-gray-200 py-4 text-center">
      <div className="px-4">
        <div className="flex justify-center gap-3 text-xs text-black mb-2">
          <Link href="/about" className="hover:opacity-60">About</Link>
          <Link href="/contact" className="hover:opacity-60">Contact</Link>
          <Link href="/terms" className="hover:opacity-60">Terms</Link>
          <Link href="/privacy" className="hover:opacity-60">Privacy</Link>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} UME</p>
      </div>
    </footer>
  )
}
