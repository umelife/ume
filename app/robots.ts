import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/marketplace', '/item/', '/safety', '/contact'],
        disallow: ['/api/', '/login', '/signup', '/verify-student', '/orders', '/profile/edit', '/create', '/communities', '/events', '/about', '/messages', '/cart', '/admin'],
      },
    ],
    sitemap: 'https://ume-life.com/sitemap.xml',
  }
}
