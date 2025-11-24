/** @type {import('next-sitemap').IConfig} */
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

const canonicalPages = [
  '/',
  '/text-to-image',
  '/text-to-video',
  '/text-to-music',
  '/mockup-generation',
  '/product-generation',
  '/ad-generation',
  '/logo-generation',
  '/sticker-generation',
  '/edit-image',
  '/edit-video',
  '/view/Landingpage',
  '/view/pricing',
  '/view/workflows',
  '/view/ArtStation',
  '/view/Generation/MockupGeneation',
  '/view/Generation/ProductGeneration',
  '/view/Generation/wildmindskit/LiveChat',
  '/view/Generation/wildmindskit/jwelary',
  '/view/HomePage',
];

const canonicalSet = new Set(canonicalPages);

module.exports = {
  siteUrl,
  outDir: './public',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/admin/*',
    '/api/*',
    '/temp/*',
    '/_next/*',
    '/404',
    '/view/*',
    '/history',
    '/bookmarks',
    '/account-management',
    '/view/account-management',
    '/signup',
    '/login',
    '/view/signup',
    '/view/login',
    '/favicon.ico',
    '/robots.txt',
  ],
  robotsTxtOptions: {
    policies: isProd
      ? [{
          userAgent: '*',
          allow: '/',
          disallow: ['/view/', '/history', '/bookmarks', '/account-management', '/signup', '/login', '/api/', '/_next/'],
        }]
      : [{ userAgent: '*', disallow: '/' }],
  },
  transform: async (config, path) => {
    if (!canonicalSet.has(path)) {
      return null;
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
