import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return NextResponse.json({ error: 'Missing url param' }, { status: 400 });

    // Validate basic safety: allow http(s) only
    if (!/^https?:\/\//i.test(target)) return NextResponse.json({ error: 'Invalid url' }, { status: 400 });

    // Force a fresh fetch to avoid conditional 304 responses from upstream storage
    const upstream = await fetch(target, { cache: 'no-store' });
    if (!(upstream.ok || upstream.status === 304)) {
      return NextResponse.json({ error: 'Upstream fetch failed', status: upstream.status }, { status: 502 });
    }

    // Stream upstream body back to client and set permissive headers so the editor can load it
    const headers = new Headers();
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    // Allow cross-origin embedding
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(upstream.body, { headers });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
