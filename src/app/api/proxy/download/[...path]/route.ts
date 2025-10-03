export const dynamic = 'force-dynamic';

const FORWARD_HEADERS = ['content-type','content-length','content-disposition'];

export async function GET(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path } = await context.params;
    const encodedPath = (path || []).join('/');
    if (!encodedPath) {
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400 });
    }

    const backendBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const targetUrl = `${backendBase}/api/proxy/download/${encodedPath}`;

    const forwardHeaders: Record<string, string> = {};
    const cookie = req.headers.get('cookie');
    if (cookie) forwardHeaders['cookie'] = cookie;

    const resp = await fetch(targetUrl, { method: 'GET', headers: forwardHeaders });

    const outHeaders = new Headers();
    FORWARD_HEADERS.forEach((h) => {
      const v = resp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });
    console.log(outHeaders);

    return new Response(resp.body, { status: resp.status, headers: outHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 });
  }
}


