import type { Metadata } from "next";
import { Archivo_Black, Work_Sans } from "next/font/google";
import "./fonts.css";
import "./globals.css";
import MixpanelProvider from "@/components/analytics/MixpanelProvider";
import HeaderWrapper from "@/components/HeaderWrapper";
import MobileHeaderWrapper from "@/components/MobileHeaderWrapper";
import StripeSetupBanner from "@/components/StripeSetupBanner";
import SimpleFooter from "@/components/homepage/SimpleFooter";
import MobileFooter from "@/components/MobileFooter";
import PushNotificationWrapper from "@/components/push/PushNotificationWrapper"
import InstallPrompt from "@/components/ui/InstallPrompt";
import WhatsNewModal from "@/components/WhatsNewModal";
import MobileTabBar from "@/components/MobileTabBar";

// Load Google Fonts using next/font (prevents CORB issues)
// Using Work Sans as a free alternative to BR Shape (geometric sans-serif)
const workSans = Work_Sans({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ume-life.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'UME — Student Marketplace for Campus Buying & Selling',
    template: '%s | UME',
  },
  description:
    'UME is the verified student marketplace where you can buy and sell textbooks, dorm items, tech, clothing, and more — exclusively within your campus community. .edu emails required.',
  keywords: [
    'campus marketplace',
    'student marketplace',
    'buy sell campus',
    'college marketplace',
    'university marketplace',
    'used textbooks',
    'dorm items for sale',
    'student secondhand',
    'campus buy sell',
    '.edu marketplace',
    'college secondhand',
    'student resale',
    'university exchange',
  ],
  authors: [{ name: 'UME' }],
  creator: 'UME',
  publisher: 'UME',
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    siteName: 'UME — Student Marketplace',
    title: 'UME — Student Marketplace for Campus Buying & Selling',
    description:
      'Buy and sell textbooks, dorm items, tech, clothing, and more with verified students on your campus. .edu email required.',
    url: BASE_URL,
    images: [
      {
        url: '/placeholders/hero-main.png',
        width: 1200,
        height: 630,
        alt: 'UME — Student Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UME — Student Marketplace for Campus Buying & Selling',
    description:
      'Buy and sell textbooks, dorm items, tech, clothing, and more with verified students on your campus.',
    images: ['/placeholders/hero-main.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UME',
    startupImage: '/icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  // Prevents iOS from auto-zooming into inputs (font-size < 16px triggers it)
  maximumScale: 5,
  themeColor: '#1e1b4b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${archivoBlack.variable}`}>
      <body className={`${workSans.className} bg-ume-bg`} style={{ isolation: 'isolate', fontWeight: 300 }} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'UME',
              alternateName: 'University Market Exchange',
              url: BASE_URL,
              logo: `${BASE_URL}/placeholders/hero-main.png`,
              description:
                'UME is a verified student marketplace where college students can buy and sell textbooks, dorm items, tech, clothing, and more exclusively within their campus community. .edu email verification ensures every user is a real student.',
              slogan: 'For students, by students',
              foundingDate: '2024',
              founders: [
                { '@type': 'Person', name: 'Ruthiik' },
                { '@type': 'Person', name: 'Bryndis' },
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'umelife.official@gmail.com',
                contactType: 'customer support',
              },
              sameAs: [],
            }),
          }}
        />
        <MixpanelProvider />
        <HeaderWrapper />
        <MobileHeaderWrapper />
        <StripeSetupBanner />
        {children}
        <SimpleFooter />
        <MobileFooter />
        <PushNotificationWrapper />
        <InstallPrompt />
        <WhatsNewModal />
        {/* Spacer so floating tab bar doesn't overlap footer content */}
        <div className="h-20" aria-hidden="true" />
        <MobileTabBar />
      </body>
    </html>
  );
}
