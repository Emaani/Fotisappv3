/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com',
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/_not-found',
    '/404',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*']
      }
    ]
  }
} 