import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ume-life.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/marketplace', '/item/', '/about', '/contact', '/safety', '/privacy', '/terms'],
        disallow: [
          '/admin',
          '/api/',
          '/login',
          '/signup',
          '/messages',
          '/create',
          '/edit/',
          '/auth/',
          '/reset-password',
          '/forgot-password',
          '/verify-student',
          '/safe-handshake/',
          '/cart',
          '/orders/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
