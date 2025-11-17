/** @type {import('next-sitemap').IConfig} */
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

module.exports = {
  siteUrl,
  outDir: './public',         // write XML files into /public
  generateRobotsTxt: true,    // also generate robots.txt
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  // Exclude admin/api/internal paths and the specific pages/assets the
  // user asked to remove from the sitemap. Do NOT blanket-exclude `/view/*`.
  exclude: [
    '/admin/*',
    '/api/*',
    '/temp/*',
    '/_next/*',
    '/404',
    // Specific pages to remove (per user request)
    '/view/video-generation',
    '/view/imagegeneration',
    '/view/Blogger',
    '/view/home/*',
    '/$',
    '/favicon.ico',
    // Static media files (specific generated font files)
    '/_next/static/media/4cf2300e9c8272f7-s.p.woff2',
    '/_next/static/media/8888a3826f4a3af4-s.p.woff2',
    '/_next/static/media/569ce4b8f30dc480-s.p.woff2',
    '/_next/static/media/b957ea75a84b6ea7-s.p.woff2',
    '/_next/static/media/93f479601ee12b01-s.p.woff2',
  ],
  robotsTxtOptions: {
    policies: isProd
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/temp/'] }]
      : [{ userAgent: '*', disallow: '/' }], // block staging/dev
  },
  transform: async (config, path) => ({
    loc: path,
    changefreq: config.changefreq,
    priority: config.priority,
    lastmod: new Date().toISOString(),
  }),
  // No additionalPaths allowlist — let the generator include site pages
  // except those explicitly excluded above. Adjust `exclude` if you want
  // to omit or add more pages later.
};
