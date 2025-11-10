/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*', '/temp/*', '/_next/*', '/404'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/temp/'],
      },
    ],
    additionalSitemaps: [
      `${siteUrl}/sitemap.xml`,
    ],
  },
  sitemapSize: 5000,
  alternateRefs: [
    { href: 'https://wildmindai.com', hreflang: 'en' },
  ],
};
