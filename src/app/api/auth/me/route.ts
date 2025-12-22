export const dynamic = 'force-dynamic'

// Server-side proxy to backend /api/auth/me endpoint
export async function GET(req: Request) {
  try {
    const { resolveBackendBase } = await import('@/lib/serverApiBase')
    const apiBase = resolveBackendBase(req)
    
    // Forward cookies from the request
    const cookie = req.headers.get('cookie')
    
    // CRITICAL DEBUG: Log cookie information for cross-subdomain debugging
    if (process.env.NODE_ENV === 'development' || req.headers.get('x-debug-auth') === 'true') {
      const allCookies = cookie ? cookie.split(';').map(c => c.trim()) : [];
      const hasAppSession = cookie ? cookie.includes('app_session=') : false;
      console.log('[API][/auth/me] Cookie debug:', {
        hasCookieHeader: !!cookie,
        cookieLength: cookie?.length || 0,
        cookiePreview: cookie ? cookie.substring(0, 150) + (cookie.length > 150 ? '...' : '') : 'N/A',
        allCookies: allCookies,
        hasAppSession,
        cookieCount: allCookies.length,
        hostname: req.headers.get('host'),
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer'),
        note: !hasAppSession ? '⚠️ app_session cookie NOT in request - cookie not being sent from browser' : '✅ app_session cookie found in request'
      });
    }
    
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
    
    // Forward Set-Cookie headers if present (for session refresh)
    const responseHeaders: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    }
    
    // Forward Set-Cookie header if backend sets a new session cookie (e.g., refresh)
    const setCookie = resp.headers.get('set-cookie')
    if (setCookie) {
      responseHeaders['set-cookie'] = setCookie
    }
    
    // Forward session refresh headers if present
    const sessionRefreshNeeded = resp.headers.get('x-session-refresh-needed')
    if (sessionRefreshNeeded) {
      responseHeaders['x-session-refresh-needed'] = sessionRefreshNeeded
    }
    const sessionExpiresIn = resp.headers.get('x-session-expires-in')
    if (sessionExpiresIn) {
      responseHeaders['x-session-expires-in'] = sessionExpiresIn
    }
    
    return new Response(text, {
      status: resp.status,
      headers: responseHeaders,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 })
  }
}
