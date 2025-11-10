/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // Ensure artifacts are written to /public for static serving in production
  outDir: './public',
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
  },
  sitemapSize: 5000,
  alternateRefs: [
    { href: 'https://wildmindai.com', hreflang: 'en' },
  ],
};
