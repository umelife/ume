import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function SimpleFooter() {
  return <footer className="studio-footer">
    <div className="footer-top"><div><p className="text-xs tracking-widest mb-4">A LITTLE MORE CAMPUS. A LOT MORE POSSIBILITY.</p><p className="footer-title">SEE YOU<br />AROUND.</p></div><Link href="/signup" className="studio-button">Join the marketplace <ArrowUpRight size={20} /></Link></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} UME / University Market Exchange</span><nav aria-label="Footer navigation">{[['Contact','/contact'],['Safety','/safety'],['Privacy','/privacy'],['Terms','/terms']].map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav><span>MADE FOR STUDENT LIFE.</span></div>
  </footer>
}
