export const dynamic = 'force-dynamic'

// Server-side proxy to backend /api/auth/me endpoint
export async function GET(req: Request) {
  try {
    const { resolveBackendBase } = await import('@/lib/serverApiBase')
    const apiBase = resolveBackendBase(req)
    
    // Forward cookies from the request
    const cookie = req.headers.get('cookie')
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true',
    }
    if (cookie) {
      headers['cookie'] = cookie
    }

    const resp = await fetch(`${apiBase}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    })

    const text = await resp.text()
    return new Response(text, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'application/json',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 })
  }
}
