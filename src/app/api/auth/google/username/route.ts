export const dynamic = 'force-dynamic'

// Server-side proxy to backend auth username selection
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const { resolveBackendBase } = await import('@/lib/serverApiBase')
    const apiBase = resolveBackendBase(req)
    const resp = await fetch(`${apiBase}/api/auth/google/username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body,
      credentials: 'include',
    })

    const text = await resp.text()
    // Forward Set-Cookie if present so cookies are stored on this domain
    const setCookie = resp.headers.get('set-cookie') || undefined
    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    }
    if (setCookie) headers['set-cookie'] = setCookie

    return new Response(text, { status: resp.status, headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 })
  }
}


