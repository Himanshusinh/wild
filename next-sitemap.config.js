/** @type {import('next-sitemap').IConfig} */
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

const canonicalPages = [
  // Main pages
  { url: '/', priority: 1.0, changefreq: 'daily' },
  
  // Canvas and Tools
  { url: '/canvas-projects', priority: 0.9, changefreq: 'weekly' },
  { url: '/edit-image', priority: 0.8, changefreq: 'weekly' },
  { url: '/edit-video', priority: 0.8, changefreq: 'weekly' },
  
  // Pricing & Features  
  { url: '/view/pricing', priority: 0.9, changefreq: 'weekly' },
  { url: '/view/ArtStation', priority: 0.7, changefreq: 'daily' },
  
  // Active Generation Features (ONLY keep text-to-image, text-to-video, text-to-music, logo-generation)
  { url: '/text-to-image', priority: 0.8, changefreq: 'weekly' },
  { url: '/text-to-video', priority: 0.8, changefreq: 'weekly' },
  { url: '/text-to-music', priority: 0.8, changefreq: 'weekly' },
  { url: '/logo-generation', priority: 0.7, changefreq: 'weekly' },
  
  // Legal Pages
  { url: '/legal', priority: 0.5, changefreq: 'monthly' },
  { url: '/legal/privacy', priority: 0.5, changefreq: 'monthly' },
  { url: '/legal/terms', priority: 0.5, changefreq: 'monthly' },
  { url: '/legal/cookie', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/aup', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/dmca', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/api-terms', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/terms-conditions', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/cancellation-refunds', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/shipping', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/relationship', priority: 0.4, changefreq: 'monthly' },
  { url: '/legal/thirdparty', priority: 0.4, changefreq: 'monthly' },
];

// Create a map of URL to page config for quick lookup
const canonicalMap = new Map(canonicalPages.map(page => [page.url, page]));

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
    '/history',
    '/bookmarks',
    '/account-management',
    '/view/account-management',
    '/signup',
    '/login',
    '/view/signup',
    '/view/login',
    '/view/HomePage',
    '/favicon.ico',
    '/robots.txt',
    // Disabled feature pages (should return 404)
    '/view/workflows',
    '/ad-generation',
    '/product-generation',
    '/mockup-generation',
    '/sticker-generation',
    '/view/Generation/wildmindskit/*',
  ],
  robotsTxtOptions: {
    policies: isProd
      ? [{
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/', '/_next/', '/history', '/bookmarks', '/account-management', '/signup', '/login'],
        }]
      : [{ userAgent: '*', disallow: '/' }],
  },
  transform: async (config, path) => {
    const pageConfig = canonicalMap.get(path);
    if (!pageConfig) {
      return null;
    }
    return {
      loc: path,
      changefreq: pageConfig.changefreq || config.changefreq,
      priority: pageConfig.priority || config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
