/*
  Ping Google and Bing with the latest sitemap URL.
  Usage: npm run ping-sitemap
*/
const https = require('https');

const siteUrl = process.env.SITE_URL || 'https://wildmindai.com';
const sitemapUrl = `${siteUrl.replace(/\/$/, '')}/sitemap.xml`;

function ping(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      const { statusCode } = res;
      res.resume(); // drain
      resolve({ url, statusCode });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.setTimeout(10000, () => {
      req.abort();
      resolve({ url, error: 'timeout' });
    });
  });
}

(async () => {
  const encoded = encodeURIComponent(sitemapUrl);
  const targets = [
    `https://www.google.com/ping?sitemap=${encoded}`,
    `https://www.bing.com/ping?sitemap=${encoded}`,
  ];

  console.log(`[ping-sitemap] Pinging sitemap: ${sitemapUrl}`);
  const results = await Promise.all(targets.map(ping));
  for (const r of results) {
    if (r.error) console.warn(`[ping-sitemap] ${r.url} -> ERROR: ${r.error}`);
    else console.log(`[ping-sitemap] ${r.url} -> ${r.statusCode}`);
  }
})();
