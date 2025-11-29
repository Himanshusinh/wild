export const dynamic = 'force-dynamic'

// Proxy to backend session creation; forwards Set-Cookie back to browser
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''
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
    let setCookie = resp.headers.get('set-cookie') || undefined
    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    }
    // Normalize cookie so it is accepted for the frontend domain
    if (setCookie) {
      try {
        const host = (req.headers.get('host') || '').split(':')[0]
        const isProd = host === 'wildmindai.com' || host === 'www.wildmindai.com'
        
        // Extract domain from original cookie if present
        const domainMatch = setCookie.match(/;\s*Domain=([^;]+)/i)
        const originalDomain = domainMatch ? domainMatch[1].trim() : null
        
        // In production, preserve .wildmindai.com domain for cross-subdomain sharing
        // In development, strip domain to scope to current host
        let normalized = setCookie
          .replace(/;\s*SameSite=[^;]*/gi, '')
        
        // Handle domain attribute
        if (isProd && originalDomain === '.wildmindai.com') {
          // Production: preserve .wildmindai.com domain for cross-subdomain cookie sharing
          // Keep the domain as-is (already in the cookie string)
          // Just ensure SameSite and Secure are correct
        } else {
          // Development or other domains: strip domain to scope to current host
          normalized = normalized.replace(/;\s*Domain=[^;]*/gi, '')
        }
        
        // Ensure Secure and SameSite are set correctly
        if (!/;\s*Secure(=|;|$)/i.test(normalized)) {
          normalized += '; Secure'
        }
        if (isProd) {
          // Production: SameSite=None for cross-subdomain
          normalized += '; SameSite=None'
        } else {
          // Development: SameSite=Lax for same-site
          normalized += '; SameSite=Lax'
        }

        headers['set-cookie'] = normalized
      } catch {
        headers['set-cookie'] = setCookie
      }
    }

    return new Response(text, { status: resp.status, headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 })
  }
}

 
