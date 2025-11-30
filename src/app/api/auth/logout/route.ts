export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    const resp = await fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })

    // Proactively clear cookie on frontend domain as well
    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
      'Set-Cookie': 'app_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure'
    }

    const text = await resp.text()
    return new Response(text, { status: resp.status, headers })
  } catch (e) {
    // Still force-clear cookie locally
    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'app_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure'
      }
    })
  }
}


