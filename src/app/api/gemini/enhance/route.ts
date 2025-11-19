import { NextRequest, NextResponse } from 'next/server';

// This route now proxies requests to the external API gateway configured via
// `NEXT_PUBLIC_API_BASE_URL` or falls back to `http://localhost:5000`.
// Keeping a proxy helps existing clients continue to call `/api/gemini/enhance`.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt || '') as string;
    const model = (body?.model || undefined) as string | undefined;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'prompt (string) is required' }, { status: 400 });
    }

    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '');
    const url = `${base}/api/gemini/enhance`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model }),
    });

    const text = await resp.text();
    const headers: Record<string,string> = { 'Content-Type': resp.headers.get('content-type') || 'application/json' };
    return new NextResponse(text, { status: resp.status, headers });
  } catch (err: any) {
    console.error('Proxy to API gateway failed:', err);
    return NextResponse.json({ error: err?.message || 'proxy_failed' }, { status: 500 });
  }
}
