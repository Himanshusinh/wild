export const dynamic = 'force-dynamic'

function pickHeaders(req: Request) {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  }

  const auth = req.headers.get('authorization')
  if (auth) headers['authorization'] = auth

  const cookie = req.headers.get('cookie')
  if (cookie) headers['cookie'] = cookie

  const contentType = req.headers.get('content-type')
  if (contentType) headers['content-type'] = contentType

  return headers
}

async function proxyToBackend(req: Request, params: { path?: string[] }) {
  const { resolveBackendBase } = await import('@/lib/serverApiBase')
  const backendBase = resolveBackendBase(req)
  if (!backendBase) {
    return new Response(JSON.stringify({ error: 'Missing backend base URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const rest = (params.path || []).join('/')
  const targetUrl = `${backendBase}/api/replicate/${rest}${url.search ? url.search : ''}`

  const method = req.method.toUpperCase()
  const headers = pickHeaders(req)

  // Forward body for non-GET/HEAD
  const body = method === 'GET' || method === 'HEAD' ? undefined : await req.text()

  const resp = await fetch(targetUrl, {
    method,
    headers,
    body,
    // @ts-ignore
    redirect: 'manual',
  })

  const responseHeaders: Record<string, string> = {
    'Content-Type': resp.headers.get('content-type') || 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  }

  const setCookie = resp.headers.get('set-cookie')
  if (setCookie) responseHeaders['set-cookie'] = setCookie

  const text = await resp.text()
  return new Response(text, { status: resp.status, headers: responseHeaders })
}

export async function GET(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}

export async function POST(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}

export async function PUT(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}

export async function PATCH(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}

export async function DELETE(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}

export async function OPTIONS(req: Request, ctx: any) {
  return proxyToBackend(req, ctx.params)
}
