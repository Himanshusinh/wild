/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://wildmindai.com',
  generateRobotsTxt: true,
  outDir: './public', // very important
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/admin/', '/api/', '/temp/', '/_next/', '/404'],
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/temp/'],
      },
    ],
  },
};
