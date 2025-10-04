export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('url') || '';
    if (!raw) return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400 });
    if (!/^https?:\/\//i.test(raw)) return new Response(JSON.stringify({ error: 'Invalid url' }), { status: 400 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(raw, {
      // Avoid passing our Origin to reduce upstream rate limiting
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
      signal: controller.signal,
      cache: 'no-store'
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return new Response(JSON.stringify({ error: 'Upstream error', status: res.status }), { status: res.status });
    const headers = new Headers();
    const pass = ['content-type','content-length','cache-control','etag','last-modified'];
    pass.forEach((h) => { const v = res.headers.get(h); if (v) headers.set(h, v); });
    if (!res.headers.get('cache-control')) headers.set('Cache-Control', 'public, max-age=600');
    return new Response(res.body, { status: 200, headers });
  } catch (e: any) {
    const status = e?.name === 'AbortError' ? 504 : 500;
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status });
  }
}


