import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes by requiring the backend session cookie (app_session) and add security headers
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const trimmedPath = pathname.replace(/\/+$/, '') || '/';
  const normalizedPath = trimmedPath.toLowerCase();

  const legacyRedirects: Record<string, string> = {
    '/view/video-generation': '/text-to-video',
    '/view/imagegeneration': '/text-to-image',
    '/view/templates': '/view/workflows',
    '/view/contactus': '/view/Landingpage?section=contact',
    '/view/blogger': '/view/Landingpage',
    '/view/x': 'https://x.com/WildMind_AI',
    '/view/youtube': 'https://www.youtube.com/@Wild-Mind-2025',
    '/view/$': '/view/Landingpage',
    '/view/&': '/view/Landingpage',
    '/view/blog': '/view/Landingpage',
    '/templates': '/view/workflows',
    '/contactus': '/view/Landingpage?section=contact',
    '/blogger': '/view/Landingpage',
    '/blog': '/view/Landingpage',
    '/$': '/view/Landingpage',
    '/&': '/view/Landingpage',
  };

  const redirectTarget = legacyRedirects[normalizedPath];
  if (redirectTarget) {
    if (redirectTarget.startsWith('http')) {
      return NextResponse.redirect(redirectTarget, { status: 308 });
    }
    const url = req.nextUrl.clone();
    const [targetPath, targetQuery] = redirectTarget.split('?');
    url.pathname = targetPath;
    url.search = targetQuery ? `?${targetQuery}` : req.nextUrl.search;
    return NextResponse.redirect(url, { status: 308 });
  }

  // Base response with security headers
  const res = NextResponse.next();
  // Force correct MIME types for SEO files
  if (pathname.endsWith('.xml')) {
    res.headers.set('Content-Type', 'application/xml');
  }
  if (pathname === '/robots.txt') {
    res.headers.set('Content-Type', 'text/plain; charset=utf-8');
  }
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

  // Enforce auth for protected routes in all environments

  // Allow public pages
  const isPublic = (
    pathname === '/' ||
    // SEO assets must be public and unprotected
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/sitemap-') ||
    pathname.endsWith('.xml') ||
    pathname.startsWith('/view/Landingpage') ||
    pathname.startsWith('/view/ArtStation') ||
    pathname.startsWith('/view/signup') ||
    pathname.startsWith('/view/signin') ||
    pathname.startsWith('/view/forgot-password') ||
    pathname.startsWith('/view/pricing') ||
    pathname.startsWith('/view/workflows') ||
    // Allow static assets and Next.js internals
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/public/')
  );

  // If root path and unauthenticated, force redirect to landing with toast
  if (pathname === '/') {
    const hasSession = req.cookies.get('app_session') || req.cookies.get('app_session.sig');
    const hasHint = Boolean(req.cookies.get('auth_hint'));
    if (!hasSession && !hasHint) {
      const url = req.nextUrl.clone();
      url.pathname = '/view/Landingpage';
      url.searchParams.set('toast', 'UNAUTHORIZED');
      return NextResponse.redirect(url);
    }
    return res;
  }
  if (isPublic) return res;

  // Require session cookie for all other matched routes (generation pages, history, bookmarks, etc.)
  // Be tolerant for OAuth redirects: allow if Firebase id token present in Authorization header
  const hasSession = req.cookies.get('app_session') || req.cookies.get('app_session.sig');
  // Do not consider Authorization header for page protection; only cookie/hint
  // Also respect a short-lived client hint cookie set right before redirect from auth
  const hasHint = Boolean(req.cookies.get('auth_hint'));
  
  if (!hasSession && !hasHint) {
    const url = req.nextUrl.clone();
    url.pathname = '/view/signup'; // Redirect to signup instead of landing page
    url.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(url);
    redirect.headers.set('X-Auth-Decision', 'redirect-signup');
    return redirect;
  }
  
  res.headers.set('X-Auth-Decision', 'allow');
  return res;
}

export const config = {
  // Protect everything except Next internals, public assets, and api routes you want open
  matcher: ['/((?!_next|api|public|favicon.ico).*)'],
};


