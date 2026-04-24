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
import MobileTabBarWrapper from "@/components/MobileTabBarWrapper";

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

export const metadata: Metadata = {
  title: { default: "UME — University Marketplace", template: "%s | UME" },
  description: "Buy and sell items safely within your university community. UME is the campus marketplace built for college students.",
  keywords: ["university marketplace", "campus marketplace", "college buy sell", "student marketplace", "UME"],
  metadataBase: new URL('https://umemarket.com'),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UME",
    startupImage: "/icon.png",
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'UME',
    title: 'UME — University Marketplace',
    description: 'Buy and sell items safely within your university community.',
    images: [{ url: '/icon.png', width: 1024, height: 1024, alt: 'UME' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UME — University Marketplace',
    description: 'Buy and sell items safely within your university community.',
    images: ['/icon.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: '#312e81',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${archivoBlack.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://umemarket.com/#organization",
                "name": "UME",
                "url": "https://umemarket.com",
                "logo": "https://umemarket.com/icon.png",
                "description": "UME is a university marketplace where college students buy and sell items safely within their campus community.",
                "foundingDate": "2024",
                "founders": [
                  { "@type": "Person", "name": "Ruthiik Satti" },
                  { "@type": "Person", "name": "Bryndis" }
                ],
                "sameAs": []
              },
              {
                "@type": "WebSite",
                "@id": "https://umemarket.com/#website",
                "url": "https://umemarket.com",
                "name": "UME — University Marketplace",
                "publisher": { "@id": "https://umemarket.com/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://umemarket.com/marketplace?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}}
        />
      </head>
      <body className={`${workSans.className} bg-ume-bg`} style={{ isolation: 'isolate', fontWeight: 300 }} suppressHydrationWarning>
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
        <MobileTabBarWrapper />
      </body>
    </html>
  );
}
