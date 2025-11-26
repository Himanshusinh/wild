export const dynamic = 'force-dynamic'

// Proxy to backend session creation; forwards Set-Cookie back to browser
export async function POST(req: Request) {
  console.log('[NEXT_API][session] ========== START ==========');
  try {
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com'
    console.log('[NEXT_API][session] API base URL:', apiBase);
    
    const body = await req.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('[NEXT_API][session] Request body:', {
        hasIdToken: !!parsedBody?.idToken,
        idTokenLength: parsedBody?.idToken?.length || 0,
        idTokenPrefix: parsedBody?.idToken?.substring(0, 30) || 'N/A',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[NEXT_API][session] Failed to parse request body:', e);
    }

    console.log('[NEXT_API][session] Forwarding request to backend:', `${apiBase}/api/auth/session`);
    const resp = await fetch(`${apiBase}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body,
      credentials: 'include',
    })

    console.log('[NEXT_API][session] Backend response:', {
      status: resp.status,
      statusText: resp.statusText,
      ok: resp.ok,
      headers: Object.fromEntries(resp.headers.entries())
    });

    const text = await resp.text();
    
    try {
      const responseData = JSON.parse(text);
      console.log('[NEXT_API][session] Backend response data:', responseData);
    } catch (e) {
      console.log('[NEXT_API][session] Backend response (non-JSON):', text.substring(0, 200));
    }

    // Forward Set-Cookie if present so cookies are stored on this domain
    let setCookie = resp.headers.get('set-cookie') || undefined
    console.log('[NEXT_API][session] Set-Cookie from backend:', setCookie ? 'Present' : 'Missing');
    if (setCookie) {
      console.log('[NEXT_API][session] Original Set-Cookie:', setCookie);
    }
    
    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    }
    // Normalize cookie so it is accepted for the frontend domain
    if (setCookie) {
      try {
        const host = (req.headers.get('host') || '').split(':')[0]
        const isProd = host === 'wildmindai.com' || host === 'www.wildmindai.com'
        console.log('[NEXT_API][session] Cookie normalization:', {
          host,
          isProd
        });
        
        // Extract domain from original cookie if present
        const domainMatch = setCookie.match(/;\s*Domain=([^;]+)/i)
        const originalDomain = domainMatch ? domainMatch[1].trim() : null
        console.log('[NEXT_API][session] Original domain:', originalDomain);
        
        // In production, preserve .wildmindai.com domain for cross-subdomain sharing
        // In development, strip domain to scope to current host
        let normalized = setCookie
          .replace(/;\s*SameSite=[^;]*/gi, '')
          .replace(/;\s*Secure/gi, '')

        // Handle domain attribute
        if (isProd && originalDomain === '.wildmindai.com') {
          // Production: preserve .wildmindai.com domain for cross-subdomain cookie sharing
          // Keep the domain as-is (already in the cookie string)
          // Just ensure SameSite and Secure are correct
          console.log('[NEXT_API][session] Preserving production domain');
        } else {
          // Development or other domains: strip domain to scope to current host
          normalized = normalized.replace(/;\s*Domain=[^;]*/gi, '')
          console.log('[NEXT_API][session] Stripped domain for development');
        }
        
        const forwardedProto = req.headers.get('x-forwarded-proto') || ''
        const referer = req.headers.get('referer') || ''
        const isLocalhost = host === 'localhost' || host === '127.0.0.1'
        const isHttps = forwardedProto.includes('https') || referer.startsWith('https://')
        const shouldUseSecure = isProd || (!isLocalhost && isHttps)

        if (shouldUseSecure) {
          normalized += '; Secure'
        }

        if (isProd) {
          // Production: SameSite=None for cross-subdomain
          normalized += '; SameSite=None'
        } else {
          // Development: SameSite=Lax for same-site
          normalized += '; SameSite=Lax'
        }

        console.log('[NEXT_API][session] Normalized Set-Cookie:', normalized);
        headers['set-cookie'] = normalized
      } catch (e) {
        console.error('[NEXT_API][session] Error normalizing cookie:', e);
        headers['set-cookie'] = setCookie
      }
    }

    console.log('[NEXT_API][session] ========== SUCCESS ==========');
    return new Response(text, { status: resp.status, headers })
  } catch (e: any) {
    console.error('[NEXT_API][session] ========== ERROR ==========');
    console.error('[NEXT_API][session] Proxy failed:', {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return new Response(JSON.stringify({ error: 'Proxy failed', details: e?.message }), { status: 500 })
  }
}

 
