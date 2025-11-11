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
    if (r.error) {
      console.warn(`[ping-sitemap] ${r.url} -> ERROR: ${r.error}`);
      continue;
    }
    const { statusCode } = r;
    let note = '';
    // Google sometimes returns 404 if the ping endpoint is rate-limited or evolving.
    if (r.url.includes('google.com/ping')) {
      if (statusCode === 200) note = 'Accepted by Google.';
      else if (statusCode === 404) note = 'Google ping endpoint responded 404 (can be normal). Rely on Search Console + robots.txt discovery.';
      else note = 'Unexpected Google status; verify in Search Console.';
    }
    // Bing now often returns 410 (Gone) as the legacy ping endpoint is deprecated in favor of IndexNow/Webmaster Tools.
    if (r.url.includes('bing.com/ping')) {
      if (statusCode === 200) note = 'Accepted by Bing.';
      else if (statusCode === 410) note = 'Bing legacy ping deprecated (410). Use IndexNow or Bing Webmaster Tools sitemap submission.';
      else note = 'Unexpected Bing status; consider IndexNow integration.';
    }
    console.log(`[ping-sitemap] ${r.url} -> ${statusCode} ${note}`);
  }
  console.log('[ping-sitemap] Completed. If endpoints return 404/410, rely on robots.txt + Search Console/Bing Webmaster Tools.');
})();
