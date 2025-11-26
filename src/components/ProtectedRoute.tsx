'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiClient } from '@/lib/axiosInstance';
import { clearAuthData, clearSessionCookies, clearReduxAuthState } from '@/lib/authUtils';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Client-side route guard that validates authentication before rendering protected content.
 * This prevents users from bypassing middleware by directly typing URLs.
 * 
 * Behavior:
 * - Checks authentication status on mount
 * - Redirects to signup if not authenticated
 * - Clears invalid sessions on 401 errors
 * - Shows loading state during auth check
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const api = getApiClient();
        const response = await api.get('/api/auth/me', {
          params: { _t: Date.now() },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });

        if (response.data?.responseStatus === 'success' && response.data?.data) {
          const userData = response.data?.data?.user || response.data?.data;
          dispatch(setUser(userData));
          if (isMounted) {
            setIsAuthenticated(true);
            setIsChecking(false);
          }
          return;
        }

        throw new Error('Invalid auth response');
      } catch (error: any) {
        if (isMounted) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            clearAuthData();
            clearSessionCookies();
            clearReduxAuthState();
            dispatch(setUser(null));
          }

          setIsChecking(false);
          setIsAuthenticated(false);
          const signupUrl = `/view/signup?next=${encodeURIComponent(pathname)}`;
          router.replace(signupUrl);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/90 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect, so return null
  }

  return <>{children}</>;
}

