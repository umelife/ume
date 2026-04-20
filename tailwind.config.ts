import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body: Work Sans (loaded via next/font, variable injected on <html>)
        sans:    ['var(--font-work-sans)', 'Work Sans', 'system-ui', 'sans-serif'],
        // Heading: Archivo Black — all-caps, campus-poster energy
        heading: ['var(--font-archivo-black)', 'Archivo Black', 'Arial Black', 'sans-serif'],
        // Display: Maintanker — hero wordmark only
        display: ['Maintanker', 'var(--font-archivo-black)', 'Arial Black', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ── UME Brand ─────────────────────────────────────────────────
        'ume-indigo':     '#130170',   // Primary — anchor, headings, buttons
        'ume-indigo-900': '#0d0050',   // Darkest indigo (gradient stop)
        'ume-indigo-800': '#1a0190',   // Mid indigo (gradient stop)
        'ume-pink':       '#fa9ebc',   // Accent — CTAs, highlights
        'ume-pink-400':   '#f87eaa',   // Pink hover
        'ume-cream':      '#f5f5f0',   // Warm section backgrounds
        'ume-bg':         '#f3f7f8',   // App canvas (cool off-white)
        // ── Platform section accents ───────────────────────────────────
        'ume-emerald':    '#34d399',   // Services (student freelancers)
        'ume-amber':      '#fbbf24',   // Communities (campus groups)
        'ume-sky':        '#60a5fa',   // Events (what's happening)
      },
      boxShadow: {
        // UME design system: shadows are indigo-tinted, never neutral black.
        // Overrides Tailwind's default sm/md/lg with brand-aligned values.
        sm:      '0 1px 2px rgba(19,1,112,0.06)',
        md:      '0 4px 12px rgba(19,1,112,0.08)',
        lg:      '0 12px 32px rgba(19,1,112,0.12)',
        // CTA / hero-element shadows
        pink:    '0 10px 24px rgba(250,158,188,0.35)',
        indigo:  '0 10px 24px rgba(19,1,112,0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-out': {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
