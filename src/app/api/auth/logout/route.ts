export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''

  // Fallback clear (host-scoped) in case backend header is missing
  const fallbackClear =
    'app_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure'

  try {
    const resp = await fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward incoming cookies so backend can clear the right session
        cookie: req.headers.get('cookie') ?? ''
      },
      credentials: 'include'
    })

    const headers = new Headers()
    headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')

    // Preserve backend Set-Cookie variants (domain-scoped clears)
    const setCookie = typeof resp.headers.getSetCookie === 'function'
      ? resp.headers.getSetCookie()
      : resp.headers.get('set-cookie')
        ? [resp.headers.get('set-cookie') as string]
        : []

    setCookie.forEach((c) => headers.append('Set-Cookie', c))
    // Add fallback host-scoped clear to be extra safe
    headers.append('Set-Cookie', fallbackClear)

    const text = await resp.text()
    return new Response(text, { status: resp.status, headers })
  } catch (e) {
    // Still force-clear cookie locally if the API call failed
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append('Set-Cookie', fallbackClear)

    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers
    })
  }
}
