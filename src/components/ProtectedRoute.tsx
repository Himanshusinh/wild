'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { hasSessionCookie } from '@/lib/authUtils';
import { getSignInUrl } from '@/routes/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
     * Optional fallback while we confirm auth state.
     */
  fallback?: React.ReactNode;
}

/**
 * Client-side route guard for pages that require authentication.
 * Falls back to the signup page when no session cookie or user is present.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback = null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state: any) => state.auth?.user);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const verify = async () => {
      try {
        const hasSession = hasSessionCookie();
        if (!mounted) return;
        if (!user && !hasSession) {
          const target = pathname && pathname !== '/' ? pathname : '/';
          router.replace(getSignInUrl(target));
        } else {
          setChecking(false);
        }
      } catch {
        if (mounted) setChecking(false);
      }
    };
    verify();
    return () => { mounted = false; };
  }, [router, pathname, user]);

  if (checking) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

