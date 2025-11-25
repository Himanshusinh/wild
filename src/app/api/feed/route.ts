import { NextRequest } from 'next/server';
import { resolveBackendBase } from '@/lib/serverApiBase';

export const dynamic = 'force-dynamic';

const PASSTHROUGH_HEADERS = ['cache-control', 'content-type', 'content-length', 'etag', 'last-modified'];

export async function GET(req: NextRequest) {
  const backendBase = resolveBackendBase(req);
  const upstreamUrl = new URL('/api/feed', backendBase);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (value !== null) upstreamUrl.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(upstreamUrl, {
      method: 'GET',
      headers: buildForwardHeaders(req),
      cache: 'no-store',
      signal: controller.signal,
    });

    const headers = buildResponseHeaders(res.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    const body = await res.text();
    return new Response(body, { status: res.status, headers });
  } catch (error: any) {
    console.error('[Feed Proxy] Failed to fetch feed:', error?.message || error);
    const status = error?.name === 'AbortError' ? 504 : 502;
    return new Response(
      JSON.stringify({ error: 'Feed proxy failed', reason: error?.message || 'Unknown error' }),
      {
        status,
        headers: { 'content-type': 'application/json' },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function buildForwardHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    Accept: req.headers.get('accept') || 'application/json',
    'User-Agent': req.headers.get('user-agent') || 'wildmind-frontend',
  };

  const cookie = req.headers.get('cookie');
  if (cookie) headers.Cookie = cookie;

  const auth = req.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  return headers;
}

function buildResponseHeaders(source: Headers) {
  const headers = new Headers();

  PASSTHROUGH_HEADERS.forEach((key) => {
    const value = source.get(key);
    if (value) headers.set(key, value);
  });

  const withSetCookie = source as Headers & { getSetCookie?: () => string[] };
  const cookies = withSetCookie.getSetCookie?.();
  if (Array.isArray(cookies) && cookies.length) {
    cookies.forEach((cookie) => headers.append('set-cookie', cookie));
  } else {
    const cookieHeader = source.get('set-cookie');
    if (cookieHeader) headers.set('set-cookie', cookieHeader);
  }

  return headers;
}



