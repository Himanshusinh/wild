export const dynamic = 'force-dynamic'

/**
 * Next.js API route proxy for backend logout
 * Ensures proper cookie clearing on both frontend and backend
 */
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL || 
                   process.env.NEXT_PUBLIC_API_BASE_URL || 
                   'https://api-gateway-services-wildmind.onrender.com';
    
    // Forward logout request to backend
    const resp = await fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Forward cookies from client request
        'Cookie': req.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    // Get response text
    const text = await resp.text();
    
    // Build response headers with cookie clearing
    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    };
    
    // Forward all Set-Cookie headers from backend (handles domain-specific cookies)
    const setCookieHeaders = resp.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      headers['Set-Cookie'] = setCookieHeaders.join(', ');
    } else {
      // Fallback: clear cookies locally if backend didn't send Set-Cookie
      const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.wildmindai.com';
      const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
      const cookiesToClear = [
        `app_session=; Path=/; Max-Age=0; Expires=${expired}; SameSite=None; Secure`,
        `app_session=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=None; Secure`,
        `app_session=; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
        `app_session=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
        `auth_hint=; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
        `auth_hint=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
      ];
      headers['Set-Cookie'] = cookiesToClear.join(', ');
    }

    return new Response(text, { 
      status: resp.status, 
      headers 
    });
  } catch (e) {
    // Even on error, try to clear cookies
    console.error('[logout route] Error:', e);
    const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.wildmindai.com';
    const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const cookiesToClear = [
      `app_session=; Path=/; Max-Age=0; Expires=${expired}; SameSite=None; Secure`,
      `app_session=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=None; Secure`,
      `app_session=; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
      `app_session=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
      `auth_hint=; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
      `auth_hint=; Domain=${cookieDomain}; Path=/; Max-Age=0; Expires=${expired}; SameSite=Lax`,
    ];
    
    return new Response(JSON.stringify({ 
      status: 'success',
      message: 'Logout completed (with errors)'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookiesToClear.join(', '),
      }
    });
  }
}


