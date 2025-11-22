import { NextRequest, NextResponse } from 'next/server';

// This route now proxies requests to the new prompt-enhancer endpoint.
// Keeping this proxy helps existing clients continue to call `/api/gemini/enhance`.
// The backend now uses a local Python FastAPI service instead of Gemini.

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
    // Proxy to the new prompt-enhancer endpoint
    const url = `${base}/api/prompt-enhancer/enhance`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Map to new API format: media_type defaults to 'image' for backward compatibility
      body: JSON.stringify({ 
        prompt, 
        media_type: 'image', // Default to image generation
      }),
    });

    const text = await resp.text();
    const headers: Record<string,string> = { 'Content-Type': resp.headers.get('content-type') || 'application/json' };
    return new NextResponse(text, { status: resp.status, headers });
  } catch (err: any) {
    console.error('Proxy to prompt enhancer service failed:', err);
    return NextResponse.json({ error: err?.message || 'proxy_failed' }, { status: 500 });
  }
}
