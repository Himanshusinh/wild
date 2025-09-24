import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect selected routes by requiring the backend session cookie (app_session)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = pathname === '/' || pathname.startsWith('/view/signup') || pathname.startsWith('/view/signin') || pathname.startsWith('/view/forgot-password');
  if (isPublic) return NextResponse.next();

  const hasSession = req.cookies.get('app_session');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/view/signup';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/view/:path*',
    '/history/:path*',
    '/bookmarks/:path*',
  ],
};


