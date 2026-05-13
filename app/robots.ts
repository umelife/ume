import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/marketplace', '/item/', '/communities', '/events', '/about', '/safety', '/contact'],
        disallow: ['/api/', '/login', '/signup', '/verify-student', '/orders', '/profile/edit', '/create', '/communities/create', '/events/create', '/messages', '/cart', '/admin'],
      },
    ],
    sitemap: 'https://ume-life.com/sitemap.xml',
  }
}
