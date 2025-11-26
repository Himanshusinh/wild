/**
 * Centralized authentication utilities
 * Provides consistent logout, session management, and auth state cleanup
 */

import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { clearMeCache } from './me';
import { store } from '@/store';

/**
 * Clears all client-side authentication data
 */
export function clearAuthData(): void {
  try {
    // BUG FIX #7: Handle localStorage unavailability (private mode, etc.)
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('isPublicGenerations');
      localStorage.removeItem('device_id'); // BUG FIX #8: Clear device_id on logout/account switch
    } catch (e) {
      // localStorage unavailable (private mode) - use sessionStorage as fallback
      console.warn('[authUtils] localStorage unavailable, using sessionStorage fallback:', e);
      try {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('isPublicGenerations');
        sessionStorage.removeItem('device_id');
      } catch (e2) {
        console.warn('[authUtils] sessionStorage also unavailable:', e2);
      }
    }
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem('me_cache');
      sessionStorage.removeItem('session_last_create');
    } catch (e) {
      console.warn('[authUtils] Failed to clear sessionStorage:', e);
    }
    
    // Clear cached user data
    try {
      clearMeCache();
    } catch (e) {
      console.warn('[authUtils] Failed to clear me cache:', e);
    }
  } catch (e) {
    console.error('[authUtils] Error clearing auth data:', e);
  }
}

/**
 * Clears all session cookies (handles multiple domain/path combinations)
 */
export function clearSessionCookies(): void {
  if (typeof document === 'undefined') return;
  
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.wildmindai.com';
  const isProd = process.env.NODE_ENV === 'production';
  
  const cookiesToClear = [
    'app_session',
    'app_session.sig',
    'auth_hint',
  ];
  
  const cookieVariants = [
    { domain: undefined, sameSite: 'None', secure: true },
    { domain: cookieDomain, sameSite: 'None', secure: true },
    { domain: undefined, sameSite: 'Lax', secure: false },
    { domain: cookieDomain, sameSite: 'Lax', secure: false },
  ];
  
  cookiesToClear.forEach(cookieName => {
    cookieVariants.forEach(variant => {
      try {
        let cookieString = `${cookieName}=; Path=/; Max-Age=0; Expires=${expired}`;
        
        if (variant.domain) {
          cookieString += `; Domain=${variant.domain}`;
        }
        
        cookieString += `; SameSite=${variant.sameSite}`;
        
        if (variant.secure || isProd) {
          cookieString += '; Secure';
        }
        
        document.cookie = cookieString;
      } catch (e) {
        console.warn(`[authUtils] Failed to clear cookie ${cookieName}:`, e);
      }
    });
  });
}

/**
 * Signs out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  try {
    if (auth?.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (e) {
    console.warn('[authUtils] Firebase signOut error (non-fatal):', e);
    // Non-fatal - continue with logout even if Firebase signOut fails
  }
}

/**
 * Clears Redux auth state
 */
export function clearReduxAuthState(): void {
  try {
    // Use dynamic import to avoid circular dependencies
    const { setUser } = require('@/store/slices/authSlice');
    if (store && typeof store.dispatch === 'function') {
      store.dispatch(setUser(null));
    }
  } catch (e) {
    console.warn('[authUtils] Failed to clear Redux auth state:', e);
  }
}

/**
 * Performs complete logout: clears all auth data, cookies, Firebase session, and Redux state
 * @param redirectTo - Optional redirect path after logout (default: '/view/Landingpage')
 */
export async function performLogout(redirectTo?: string): Promise<void> {
  try {
    // 1. Clear client-side data first
    clearAuthData();
    clearSessionCookies();
    clearReduxAuthState();
    
    // 2. Sign out from Firebase (non-blocking)
    await signOutFirebase();
    
    // 3. Call backend logout endpoint to clear server-side session and Redis cache
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 
                     process.env.API_BASE_URL || 
                     'https://api-gateway-services-wildmind.onrender.com';
      
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.warn('[authUtils] Backend logout call failed (non-fatal):', e);
      // Non-fatal - continue with redirect even if backend call fails
    }
    
    // 4. Prevent browser back button navigation
    if (typeof window !== 'undefined') {
      try {
        history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
          history.pushState(null, '', window.location.href);
        });
      } catch (e) {
        console.warn('[authUtils] Failed to prevent back navigation:', e);
      }
      
      // 5. Redirect to landing page with deferred toast
      try {
        localStorage.setItem('toastMessage', 'LOGOUT_SUCCESS');
      } catch {}
      const redirectPath = redirectTo || '/view/Landingpage';
      window.location.replace(redirectPath);
    }
  } catch (e) {
    console.error('[authUtils] Logout error:', e);
    // Even on error, try to redirect
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('toastMessage', 'LOGOUT_FAILED');
      } catch {}
      window.location.replace('/view/Landingpage');
    }
  }
}

/**
 * Checks if user is authenticated based on session cookie presence
 */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    return document.cookie.includes('app_session=') || 
           document.cookie.includes('auth_hint=');
  } catch {
    return false;
  }
}

