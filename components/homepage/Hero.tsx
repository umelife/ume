"use client"

import Link from 'next/link'
import { ArrowDown, ArrowUpRight, BookOpen, Headphones, LampDesk, Sparkles } from 'lucide-react'

export default function Hero() {
  return (
    <section className="campus-hero" aria-labelledby="campus-title">
      <div className="hero-kicker"><span>BUY. SELL. LEVEL UP.</span><span>YOUR CAMPUS, CONNECTED.</span><span className="hidden sm:inline">A LITTLE MORE LOCAL ↗</span></div>
      <div className="hero-stage">
        <div className="hero-copy">
          <p className="studio-label"><span className="status-dot" /> THE UNIVERSITY MARKET EXCHANGE</p>
          <h1 id="campus-title"><span className="hero-word-one">FINDERS.</span><br /><span className="hero-word-two">KEEPERS.</span><br /><span className="hero-word-three">GOOD DEALS.</span></h1>
          <p className="hero-description">Your campus. Your next great find.<br />Buy pre-loved gems. Sell your old favorites. Keep the good stuff going.</p>
          <div className="hero-actions"><Link href="/marketplace" className="studio-button">Explore the marketplace <ArrowUpRight size={19} /></Link><Link href="/signup" className="studio-link">Start your next quest <ArrowUpRight size={17} /></Link></div>
        </div>
        <div className="hero-collage" aria-label="Books, tech, and dorm essentials — find a new home for your campus favorites">
          <div className="collage-grid" aria-hidden="true" />
          <div className="collage-note">Your next favorite thing<br />is closer than you think. <span>↙</span></div>
          <Link href="/marketplace?category=books" className="object-card object-books"><span className="object-number">01 / READ & REPEAT</span><BookOpen aria-hidden="true" /><span className="object-name">A new chapter.<ArrowUpRight size={20} /></span></Link>
          <Link href="/marketplace?category=tech-and-gadgets" className="object-card object-tech"><span className="object-number">02 / GOOD CONNECTIONS</span><Headphones aria-hidden="true" /><span className="object-name">Find your frequency.<ArrowUpRight size={20} /></span></Link>
          <Link href="/marketplace?category=dorm-and-decor" className="object-card object-dorm"><span className="object-number">03 / MAKE IT YOURS</span><LampDesk aria-hidden="true" /><span className="object-name">Room for a little more.<ArrowUpRight size={20} /></span></Link>
          <div className="collage-sticker" aria-hidden="true"><Sparkles size={25} /><span>LESS NEW.<br />MORE YOU.</span></div>
        </div>
      </div>
      <div className="hero-bottom"><span>NEW FINDS. NEXT LEVEL CAMPUS LIFE.</span><a href="#campus-discover">TAKE A LOOK AROUND <ArrowDown size={15} /></a><span className="hidden sm:inline">MADE FOR STUDENT LIFE ©</span></div>
    </section>
  )
}
