export const dynamic = 'force-dynamic';

const FORWARD_HEADERS = ['content-type','content-length','accept-ranges','content-range','cache-control','etag','last-modified','content-disposition'];

export async function GET(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path } = await context.params;
    const encodedPath = (path || []).join('/');
    if (!encodedPath) {
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400 });
    }

    const backendBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
    const targetUrl = `${backendBase}/api/proxy/resource/${encodedPath}`;

    const forwardHeaders: Record<string, string> = {};
    const range = req.headers.get('range');
    if (range) forwardHeaders['range'] = range;
    const cookie = req.headers.get('cookie');
    if (cookie) forwardHeaders['cookie'] = cookie;

    const resp = await fetch(targetUrl, { method: 'GET', headers: forwardHeaders });

    const outHeaders = new Headers();
    FORWARD_HEADERS.forEach((h) => {
      const v = resp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });

    return new Response(resp.body, { status: resp.status, headers: outHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 });
  }
}


