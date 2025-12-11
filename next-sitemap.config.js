/** @type {import('next-sitemap').IConfig} */
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';

// Import blog posts to generate dynamic URLs
const { blogPosts } = require('./src/app/blog/data/blogPosts.ts');

const canonicalPages = [
  // Main pages - ALL DAILY
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/view/Landingpage', priority: 0.9, changefreq: 'daily' },
  { url: '/view/HomePage', priority: 0.9, changefreq: 'daily' },
  
  // Canvas and Tools - ALL DAILY
  { url: '/canvas-projects', priority: 0.9, changefreq: 'daily' },
  { url: '/edit-image', priority: 0.8, changefreq: 'daily' },
  { url: '/edit-video', priority: 0.8, changefreq: 'daily' },
  
  // Pricing & Features - ALL DAILY
  { url: '/view/pricing', priority: 0.9, changefreq: 'daily' },
  { url: '/view/ArtStation', priority: 0.7, changefreq: 'daily' },
  
  // Blog main page - DAILY
  { url: '/blog', priority: 0.9, changefreq: 'daily' },
  
  // Active Generation Features - ALL DAILY
  { url: '/text-to-image', priority: 0.8, changefreq: 'daily' },
  { url: '/text-to-video', priority: 0.8, changefreq: 'daily' },
  { url: '/text-to-music', priority: 0.8, changefreq: 'daily' },
  { url: '/logo-generation', priority: 0.7, changefreq: 'daily' },
  { url: '/logo', priority: 0.7, changefreq: 'daily' },
  { url: '/sticker-generation', priority: 0.7, changefreq: 'daily' },
  
  // Legal Pages - ALL DAILY for consistency
  { url: '/legal', priority: 0.5, changefreq: 'daily' },
  { url: '/legal/privacy', priority: 0.5, changefreq: 'daily' },
  { url: '/legal/terms', priority: 0.5, changefreq: 'daily' },
  { url: '/legal/cookie', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/aup', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/dmca', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/api-terms', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/terms-conditions', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/cancellation-refunds', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/shipping', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/relationship', priority: 0.4, changefreq: 'daily' },
  { url: '/legal/thirdparty', priority: 0.4, changefreq: 'daily' },
];

// Add all blog posts dynamically - DAILY crawl
blogPosts.forEach((post) => {
  canonicalPages.push({
    url: `/blog/${post.id}`,
    priority: 0.7,
    changefreq: 'daily',
  });
});

// Create a map of URL to page config for quick lookup
const canonicalMap = new Map(canonicalPages.map(page => [page.url, page]));

module.exports = {
  siteUrl,
  outDir: './public',
  generateRobotsTxt: true,
  changefreq: 'daily', // Default to daily for everything
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
    '/favicon.ico',
    '/robots.txt',
    // Disabled feature pages (should return 404)
    '/view/workflows',
    '/ad-generation',
    '/product-generation',
    '/mockup-generation',
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
      // Allow other discovered pages with default daily frequency
      return {
        loc: path,
        changefreq: 'daily',
        priority: config.priority,
        lastmod: new Date().toISOString(),
      };
    }
    return {
      loc: path,
      changefreq: pageConfig.changefreq || 'daily',
      priority: pageConfig.priority || config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
