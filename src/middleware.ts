import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes by requiring the backend session cookie (app_session) and add security headers
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Base response with security headers
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Allow OAuth popups to function (prevents window.closed blocking)
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Minimal CSP to prevent framing and restrict sources (adjust as needed)
  const csp = [
    "default-src 'self'",
    // Allow inline styles (Next.js) and our own styles
    "style-src 'self' 'unsafe-inline'",
    // Allow Google/Firebase auth scripts
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://accounts.google.com https://www.googleapis.com",
    // Some browsers use script-src-elem for external scripts
    "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://accounts.google.com",
    // Images and media from HTTPS/data/blob
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https: http:",
    // Permit API/XHR/WebSocket to Google/Firebase backends and our gateway
    "connect-src 'self' https: http: https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com",
    // Allow Google and Firebase OAuth popups/iframes
    "frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com https://*.firebase.com",
    // Do not allow our app to be framed by other sites
    "frame-ancestors 'none'",
    // Hardening
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);

  // Dev bypass: when frontend runs on localhost and API is on a different domain (e.g., ngrok),
  // the httpOnly session cookie is scoped to the API domain and is not visible here.
  // Allow navigation without enforcing the cookie in non-production environments.
  const host = req.headers.get('host') || '';
  if (process.env.NODE_ENV !== 'production' || host.includes('localhost')) {
    return res;
  }

  // Allow public pages
  const isPublic = (
    pathname === '/' ||
    pathname.startsWith('/view/Landingpage') ||
    pathname.startsWith('/view/ArtStation') ||
    pathname.startsWith('/view/signup') ||
    pathname.startsWith('/view/signin') ||
    pathname.startsWith('/view/forgot-password')
  );
  if (isPublic) return res;

  // Require session cookie for all other matched routes
  const hasSession = req.cookies.get('app_session');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/view/Landingpage';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  // Protect everything except Next internals, public assets, and api routes you want open
  matcher: ['/((?!_next|api|public|favicon.ico).*)'],
};


