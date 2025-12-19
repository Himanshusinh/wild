/**
 * Generate blog sitemap data from TypeScript file
 * This script extracts minimal blog post data needed for sitemap generation
 * Run this before next-sitemap: npm run prebuild
 */

const fs = require('fs');
const path = require('path');

// Use tsx to load the TypeScript file
let blogPosts = [];

try {
  // Try to use tsx if available
  const { register } = require('tsx/cjs/api');
  register();
  
  const blogModule = require('../src/app/blog/data/blogPosts.ts');
  blogPosts = blogModule.blogPosts || [];
} catch (error) {
  console.error('Error loading blog posts:', error.message);
  // Fallback: try to read and parse manually (basic approach)
  try {
    const blogPath = path.join(__dirname, '../src/app/blog/data/blogPosts.ts');
    const content = fs.readFileSync(blogPath, 'utf8');
    
    // Extract blog post IDs using regex (simple approach)
    const idMatches = content.matchAll(/id:\s*(\d+)/g);
    const ids = Array.from(idMatches, m => parseInt(m[1]));
    
    blogPosts = ids.map(id => ({
      id,
      publishedAt: null,
      updatedAt: null,
      createdAt: null,
    }));
    
    console.warn('⚠️  Using fallback method - only IDs extracted');
  } catch (fallbackError) {
    console.error('Fallback also failed:', fallbackError.message);
    blogPosts = [];
  }
}

// Extract only the data needed for sitemap
const sitemapData = blogPosts.map(post => ({
  id: post.id,
  publishedAt: post.publishedAt || null,
  updatedAt: post.updatedAt || null,
  createdAt: post.createdAt || null,
}));

// Write to a JSON file that can be easily required
const outputPath = path.join(__dirname, '../src/app/blog/data/blogPosts.sitemap.json');
fs.writeFileSync(outputPath, JSON.stringify(sitemapData, null, 2), 'utf8');

console.log(`✅ Generated sitemap data for ${sitemapData.length} blog posts`);
console.log(`📄 Output: ${outputPath}`);

module.exports = { blogPosts: sitemapData };

