export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check session status
 * Helps verify session persistence without waiting for logout
 */
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

    // Get response as text first (handles compression automatically)
    const text = await resp.text()
    
    // Only forward specific headers (not compression headers)
    const responseHeaders: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    }
    
    // Forward Set-Cookie header if backend sets a new session cookie
    const setCookie = resp.headers.get('set-cookie')
    if (setCookie) {
      responseHeaders['set-cookie'] = setCookie
    }
    
    return new Response(text, {
      status: resp.status,
      headers: responseHeaders,
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ 
      error: 'Debug endpoint failed', 
      message: e?.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

