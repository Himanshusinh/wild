'use client';

import { signOut } from 'firebase/auth';
import type { AppDispatch } from '@/store';
import { store } from '@/store';
import { setUser, clearAuthError } from '@/store/slices/authSlice';
import { auth } from './firebase';

type RouterLike = { replace: (url: string) => void };

export interface PerformLogoutOptions {
  /**
   * Destination after logout. Pass `false` to skip navigation.
   */
  redirectTo?: string | false;
  /**
   * Optional router reference (Next.js useRouter result).
   */
  router?: RouterLike;
  /**
   * Skip calling the backend logout endpoint (client cleanup only).
   */
  skipBackend?: boolean;
  /**
   * Force a hard reload after redirect to prevent back navigation.
   */
  hardReload?: boolean;
}

const EXPIRE = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
const COOKIE_NAMES = ['app_session', 'app_session.sig', 'auth_hint'];
const SAME_SITE_FLAGS = [
  'SameSite=None; Secure',
  'SameSite=Lax',
  'SameSite=Strict',
];

const getCandidateDomains = (override?: string): string[] => {
  const domains: string[] = [''];
  const envDomain = override ?? process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? '';
  if (envDomain) {
    const normalized = envDomain.startsWith('.') ? envDomain : `.${envDomain}`;
    domains.push(normalized);
  }
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host && !domains.includes(host)) domains.push(host);
      const rootHost = host?.startsWith('.') ? host : `.${host}`;
      if (rootHost && !domains.includes(rootHost)) domains.push(rootHost);
    }
  } catch { }
  return domains;
};

/**
 * Remove auth-related data from storage (local/session).
 */
export function clearAuthData(): void {
  try {
    const keys = [
      'authToken',
      'user',
      'auth_hint',
      'me_cache',
      'app_session',
      'app_session.sig',
    ];
    keys.forEach((key) => {
      try { localStorage.removeItem(key); } catch { }
      try { sessionStorage.removeItem(key); } catch { }
    });
  } catch { }

  // Clear caches (best-effort; may not be available)
  try {
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name).catch(() => { });
        });
      }).catch(() => { });
    }
  } catch { }
}

/**
 * Expire all known session cookies (multiple SameSite + domain variants).
 */
export function clearSessionCookies(domainOverride?: string): void {
  if (typeof document === 'undefined') return;

  const domains = getCandidateDomains(domainOverride);

  COOKIE_NAMES.forEach((name) => {
    domains.forEach((domain) => {
      SAME_SITE_FLAGS.forEach((sameSiteFlag) => {
        const domainPart = domain ? `; Domain=${domain}` : '';
        document.cookie = `${name}=; ${EXPIRE}; Path=/; ${sameSiteFlag}${domainPart}`;
      });
    });
  });
}

/**
 * Firebase sign-out helper (safe on both web and SSR).
 */
export async function signOutFirebase(): Promise<void> {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (error) {
    console.warn('[authUtils] signOutFirebase failed', error);
  }
}

/**
 * Clears Redux auth state synchronously.
 */
export function clearReduxAuthState(dispatch?: AppDispatch): void {
  const targetDispatch = dispatch ?? store?.dispatch;
  if (!targetDispatch) return;
  try {
    targetDispatch(setUser(null));
    targetDispatch(clearAuthError());
  } catch (error) {
    console.warn('[authUtils] Failed to reset Redux auth state', error);
  }
}

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const cookies = document.cookie?.split(';') ?? [];
  return cookies.some((cookie) => {
    const trimmed = cookie.trim().toLowerCase();
    return trimmed.startsWith('app_session=') || trimmed.startsWith('app_session.sig=') || trimmed.startsWith('auth_hint=');
  });
}

/**
 * Centralized logout helper that cleans up client state and calls the backend.
 */
export async function performLogout(options: PerformLogoutOptions = {}): Promise<void> {
  const {
    redirectTo = '/view/HomePage?toast=LOGOUT_SUCCESS',
    router,
    skipBackend = false,
    hardReload = false,
  } = options;

  clearAuthData();
  clearReduxAuthState();
  clearSessionCookies();
  await signOutFirebase();

  if (!skipBackend) {
    try {
      const api = (await import('./axiosInstance')).default;
      await api.post('/api/auth/logout');
    } catch (error) {
      console.warn('[authUtils] Backend logout failed', error);
    }
  }

  if (redirectTo && typeof window !== 'undefined') {
    if (router) {
      router.replace(redirectTo);
    } else {
      window.location.replace(redirectTo);
      if (hardReload) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 150);
      }
    }
  }
}

