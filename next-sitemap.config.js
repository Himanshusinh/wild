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
  exclude: ['/admin/*', '/api/*', '/temp/*', '/_next/*', '/404'],
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
};
