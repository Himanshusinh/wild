import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const localApiBase = process.env.LOCAL_UPSCALE_GENERATION_MODEL;
    if (!localApiBase) {
      return new Response(
        JSON.stringify({ error: 'LOCAL_UPSCALE_GENERATION_MODEL not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const url = searchParams.get('url');

    if (!path && !url) {
      return new Response(
        JSON.stringify({ error: 'Provide either `path` or `url` query parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = url ? url : `${localApiBase}${path}`;

    const upstream = await fetch(targetUrl, { method: 'GET' });
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Upstream fetch failed: ${upstream.status}`, details: text }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstream.arrayBuffer();
    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Proxy failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


