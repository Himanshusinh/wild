import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const { resolveBackendBase } = await import('@/lib/serverApiBase');
    const apiBase = resolveBackendBase(req);
    const path = req.nextUrl.pathname;

    // Construct backend URL
    const targetUrl = `${apiBase}${path}${req.nextUrl.search}`;
    console.log('[CreditsProxy] Forwarding to:', targetUrl);

    // Prepare headers
    const forwardHeaders: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    // Forward Authorization and Cookie headers
    const authHeader = req.headers.get('authorization');
    if (authHeader) forwardHeaders['authorization'] = authHeader;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) forwardHeaders['cookie'] = cookieHeader;

    // Forward request body for non-GET/HEAD methods
    const body = (req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : undefined;

    const resp = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      // Important: include credentials for cookies
      credentials: 'include',
    });

    // Forward response body and status
    const respBody = await resp.text();

    // Forward relevant response headers
    const outHeaders = new Headers();
    const headersToForward = ['content-type', 'set-cookie', 'cache-control', 'expires', 'pragma'];
    headersToForward.forEach(h => {
      const v = resp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });

    return new NextResponse(respBody, {
      status: resp.status,
      headers: outHeaders,
    });
  } catch (error: any) {
    console.error('[CreditsProxy] Error:', error);
    return NextResponse.json({ error: 'Proxy failed', details: error.message }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
