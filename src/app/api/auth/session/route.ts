export const dynamic = 'force-dynamic'

// Proxy to backend session creation; forwards Set-Cookie back to browser
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    const body = await req.text()

    const resp = await fetch(`${apiBase}/api/auth/session`, {
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

 
