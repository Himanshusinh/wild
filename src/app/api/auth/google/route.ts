export const dynamic = 'force-dynamic'

// Server-side proxy to backend auth to avoid CORS during ngrok usage
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    const resp = await fetch(`${apiBase}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      // Forward body and include credentials so backend can set cookies
      body: JSON.stringify(body),
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


