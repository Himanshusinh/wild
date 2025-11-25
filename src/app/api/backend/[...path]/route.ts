import { NextRequest } from 'next/server';
import { resolveBackendBase } from '@/lib/serverApiBase';

export const dynamic = 'force-dynamic';

const FORBIDDEN_REQUEST_HEADERS = new Set([
  'host',
  'content-length',
  'connection',
  'accept-encoding',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-dest',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
  'origin',
]);

const PASSTHROUGH_RESPONSE_HEADERS = [
  'cache-control',
  'content-type',
  'content-length',
  'etag',
  'last-modified',
  'location',
];

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const;

type Method = (typeof METHODS)[number];

async function proxyHandler(req: NextRequest, context: { params: { path?: string[] } }) {
  const { params } = context;
  const path = Array.isArray(params?.path) ? params!.path!.join('/') : '';
  const backendBase = resolveBackendBase(req);
  const upstreamUrl = new URL(path ? `/${path}` : '/', backendBase);

  req.nextUrl.searchParams.forEach((value, key) => {
    if (value !== null) upstreamUrl.searchParams.set(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!FORBIDDEN_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const init: RequestInit = {
      method: req.method,
      headers,
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const body = await req.arrayBuffer();
      init.body = body.byteLength > 0 ? body : undefined;
    }

    const res = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers();
    PASSTHROUGH_RESPONSE_HEADERS.forEach((key) => {
      const value = res.headers.get(key);
      if (value) responseHeaders.set(key, value);
    });

    const asHeadersWithCookie = res.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = asHeadersWithCookie.getSetCookie?.();
    if (Array.isArray(cookies) && cookies.length) {
      cookies.forEach((cookie) => responseHeaders.append('set-cookie', cookie));
    } else {
      const cookieHeader = res.headers.get('set-cookie');
      if (cookieHeader) responseHeaders.set('set-cookie', cookieHeader);
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const status = error?.name === 'AbortError' ? 504 : 502;
    return new Response(
      JSON.stringify({
        error: 'Backend proxy failed',
        reason: error?.message || 'Unknown error',
        path: path || '/',
      }),
      {
        status,
        headers: { 'content-type': 'application/json' },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const POST = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const PUT = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const PATCH = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const DELETE = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const OPTIONS = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);
export const HEAD = (req: NextRequest, ctx: { params: { path?: string[] } }) => proxyHandler(req, ctx);


