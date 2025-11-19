export const dynamic = 'force-dynamic';

const FORWARD_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'last-modified',
  'content-disposition'
];

export async function GET(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path } = await context.params;
    const encodedPath = (path || []).join('/');
    if (!encodedPath) {
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400 });
    }

    // Preserve incoming query params (w, q, fmt, t, etc.)
    const url = new URL(req.url);
    const qs = url.search ? url.search.substring(1) : '';

    const backendBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
    const targetUrl = `${backendBase}/api/proxy/thumb/${encodedPath}${qs ? `?${qs}` : ''}`;

    const forwardHeaders: Record<string, string> = {};
    const cookie = req.headers.get('cookie');
    if (cookie) forwardHeaders['cookie'] = cookie;
    forwardHeaders['Accept'] = '*/*';

    // Add timeout for fetch requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const resp = await fetch(targetUrl, { method: 'GET', headers: forwardHeaders, signal: controller.signal })
      .finally(() => clearTimeout(timeout));

    const outHeaders = new Headers();
    FORWARD_HEADERS.forEach((h) => {
      const v = resp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });
    // Allow embedding thumbnails cross-origin
    outHeaders.set('Access-Control-Allow-Origin', '*');
    outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    return new Response(resp.body, { status: resp.status, headers: outHeaders });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timeout' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
