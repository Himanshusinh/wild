import axios from 'axios'
import { auth } from './firebase'
import { showFalErrorToast } from './falToast'
import { clearAuthData } from './authUtils'

// Try to extract an ID token from localStorage in a tolerant way
const getStoredIdToken = (): string | null => {
  try {
    // First try direct token
    const directToken = localStorage.getItem('authToken')
    if (directToken && directToken.startsWith('eyJ')) {
      return directToken
    }

    // Try user object
    const userString = localStorage.getItem('user')
    if (userString) {
      const userObj = JSON.parse(userString)
      const token = userObj?.idToken || userObj?.token || null
      if (token && token.startsWith('eyJ')) {
        return token
      }
    }

    // Try authToken as JSON object
    if (directToken) {
      try {
        const authToken = JSON.parse(directToken)
        const token = authToken?.accessToken || authToken?.idToken || authToken?.token || null
        if (token && token.startsWith('eyJ')) {
          return token
        }
      } catch (e) {
        // If it's not JSON, it might be a direct token
        if (directToken.startsWith('eyJ')) {
          return directToken
        }
      }
    }

    return null
  } catch (err) {
    console.log('[getStoredIdToken] Error extracting token:', err)
    return null
  }
}

// Centralized axios instance configured to send cookies and optional Authorization header
// Uses NEXT_PUBLIC_API_BASE_URL (must be set in environment variables)
const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()

const axiosInstance = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
  timeout: 1200000, // 20 minutes timeout for long-running requests like video generation/upscale
  headers: {
    'Content-Type': 'application/json',
    // Suppress ngrok browser warning HTML page so API returns JSON
    'ngrok-skip-browser-warning': 'true'
  }
})

// Toggle verbose network debug logging
const isApiDebugEnabled = (): boolean => {
  try {
    if (typeof window !== 'undefined' && (window as any).__API_DEBUG === true) return true
    const flag = localStorage.getItem('api_debug')
    if (flag && flag.toLowerCase() === 'true') return true
  } catch { }
  return process.env.NEXT_PUBLIC_API_DEBUG === 'true'
}

// Attach device headers; rely on Bearer tokens primarily (session cookie is optional fallback)
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // If sending FormData, do NOT force JSON content-type.
    // Let the browser/Axios set the proper multipart boundary.
    try {
      const anyConfig: any = config as any;
      const data = anyConfig?.data;
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      if (isFormData) {
        const hdrs: any = anyConfig.headers || {};
        // AxiosHeaders supports .delete(); plain objects use delete.
        try { if (typeof hdrs.delete === 'function') hdrs.delete('Content-Type'); } catch { }
        try { if (typeof hdrs.delete === 'function') hdrs.delete('content-type'); } catch { }
        try { delete hdrs['Content-Type']; } catch { }
        try { delete hdrs['content-type']; } catch { }
        anyConfig.headers = hdrs;
      }
    } catch { }

    // Use backend baseURL for all calls; session is now direct to backend
    const url = typeof config.url === 'string' ? config.url : ''

    // For backend data endpoints (credits, generations, engagement, auth/me), attach Bearer id token so backend accepts without cookies
    if (
      url.startsWith('/api/credits/') ||
      url.startsWith('/api/generations') ||
      url.startsWith('/api/engagement') ||
      url === '/api/auth/me'
    ) {
      // Gentle delay if session cookie is racing to be set after auth
      try {
        const hasHint = document.cookie.includes('auth_hint=')
        const hasSession = document.cookie.includes('app_session=')
        if (hasHint && !hasSession) {
          if (isApiDebugEnabled()) console.log('[API][request-delay] auth_hint present, delaying 100ms for session cookie')
          await new Promise((r) => setTimeout(r, 100))
        }
      } catch { }

      // CRITICAL FIX: Try to get fresh token from Firebase first, fallback to stored token
      // This prevents using expired tokens from localStorage
      let token: string | null = null;
      try {
        // Try to get fresh token from Firebase (non-blocking, don't force refresh to avoid delays)
        if (auth?.currentUser) {
          try {
            // Get token without forcing refresh (Firebase SDK automatically refreshes if needed)
            token = await auth.currentUser.getIdToken(false);
            if (isApiDebugEnabled()) {
              console.log('[API][request] Got fresh token from Firebase', {
                hasToken: !!token,
                tokenPrefix: token ? token.substring(0, 20) : 'N/A'
              });
            }
          } catch (tokenError: any) {
            // If getting fresh token fails, fall back to stored token
            if (isApiDebugEnabled()) {
              console.warn('[API][request] Failed to get fresh token, using stored token:', tokenError?.message);
            }
            token = getStoredIdToken();
          }
        } else {
          // No Firebase user, use stored token as fallback
          token = getStoredIdToken();
          if (isApiDebugEnabled()) {
            console.log('[API][request] No Firebase user, using stored token', { hasToken: !!token });
          }
        }
      } catch (error: any) {
        // Fallback to stored token if anything fails
        token = getStoredIdToken();
        if (isApiDebugEnabled()) {
          console.warn('[API][request] Error getting token, using stored token:', error?.message);
        }
      }

      if (token) {
        const headers: any = config.headers || {}
        headers['Authorization'] = `Bearer ${token}`
        config.headers = headers
      }
      // Be explicit about no-cache for generations endpoints to avoid stale browser cache
      try {
        if (url.startsWith('/api/generations')) {
          const headers: any = config.headers || {}
          headers['Cache-Control'] = 'no-cache'
          headers['Pragma'] = 'no-cache'
          headers['Expires'] = '0'
          config.headers = headers
        }
      } catch { }
      // Leave baseURL pointing to external backend (default)
    }

    // Stable device id persisted in localStorage
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      const random = (globalThis.crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`
      deviceId = String(random)
      localStorage.setItem('device_id', deviceId)
    }

    const ua = navigator.userAgent || ''
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'unknown'
    const deviceInfo = {
      browser: /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Unknown',
      os: /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android' : /Linux/i.test(ua) ? 'Linux' : 'Unknown',
      device: /Mobile/i.test(ua) ? 'Mobile' : 'Desktop'
    }

    // Ensure headers is a mutable object (AxiosHeaders supports set)
    const headers: any = config.headers || {}
    headers['X-Device-Id'] = deviceId
    headers['X-Device-Name'] = platform
    headers['X-Device-Info'] = JSON.stringify(deviceInfo)

    // Do NOT set X-Forwarded-* headers from the browser. Proxies (ngrok/Vercel) will set them.

    // Route auth endpoints through backend baseURL (do not proxy via Next.js)
    try {
      const rawUrl = typeof config.url === 'string' ? config.url : ''
      if (rawUrl.startsWith('/api/auth/')) {
        config.baseURL = resolvedBaseUrl
        if (isApiDebugEnabled()) console.log('[API][auth-route]', { url: rawUrl, baseURL: config.baseURL })
      }
    } catch { }

    // Attach bearer token for protected backend routes (primary auth path); cookie is optional fallback
    try {
      const raw = typeof config.url === 'string' ? config.url : ''
      const base = (config.baseURL as string) || axiosInstance.defaults.baseURL || ''

      // Determine the path - handle both relative and absolute URLs
      let path = ''
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        // Already a full URL, extract pathname directly
        try {
          const urlObj = new URL(raw)
          path = urlObj.pathname || ''
        } catch {
          // Fallback: extract path from URL string
          const match = raw.match(/https?:\/\/[^\/]+(\/.*)?$/)
          path = match && match[1] ? match[1] : raw
        }
      } else {
        // Relative URL, construct full URL with base
        try {
          const full = new URL(raw, base || 'http://localhost')
          path = full.pathname || ''
        } catch {
          // Fallback: use raw as path if URL construction fails
          path = raw.startsWith('/') ? raw : `/${raw}`
        }
      }

      // Treat most backend routes as protected to reduce 401s in early post-auth; allow session creation route to go without bearer
      const isProtectedApi = path.startsWith('/api/') && path !== '/api/auth/session'
      // Gentle delay for protected APIs when auth just completed and Set-Cookie may lag
      if (isProtectedApi) {
        try {
          const hasHint = document.cookie.includes('auth_hint=')
          const hasSession = document.cookie.includes('app_session=')
          if (hasHint && !hasSession) {
            if (isApiDebugEnabled()) console.log('[API][request-delay] protected call while auth_hint present, delaying 100ms', { path })
            await new Promise((r) => setTimeout(r, 100))
          }
        } catch { }
      }
      if (isProtectedApi) {
        let idToken = getStoredIdToken()
        // If not in storage, try to fetch a fresh token from Firebase
        if (!idToken && auth?.currentUser) {
          // Return a promise so axios waits for token
          return auth.currentUser.getIdToken().then((fresh) => {
            const hdrs: any = config.headers || {}
            if (fresh) hdrs['Authorization'] = `Bearer ${fresh}`
            if (isApiDebugEnabled()) console.log('[API][attach-bearer][fresh]', { path, hasToken: Boolean(fresh) })
            config.headers = hdrs
            return config
          }).catch(() => config)
        }
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`
          if (isApiDebugEnabled()) console.log('[API][attach-bearer][cached]', { path, hasToken: true })
        } else {
          if (isApiDebugEnabled()) console.log('[API][attach-bearer][missing]', { path })
          // Log warning if token is missing for protected API
          console.warn('[API][attach-bearer] No token available for protected API:', { path, url: raw, baseURL: base })
        }
      }
    } catch (err) {
      // Log error instead of silently failing
      console.error('[API][attach-bearer] Error determining path or attaching token:', err, {
        url: typeof config.url === 'string' ? config.url : 'unknown',
        baseURL: (config.baseURL as string) || axiosInstance.defaults.baseURL || 'unknown'
      })
    }

    // Always log critical auth info (not just when debug is enabled)
    try {
      const base = (config.baseURL as string) || axiosInstance.defaults.baseURL
      const authHeader = (headers as any)?.Authorization || (config.headers as any)?.Authorization
      const hasAuth = Boolean(authHeader)

      if (isApiDebugEnabled()) {
        console.log('[API][request]', {
          method: (config.method || 'get').toUpperCase(),
          url,
          baseURL: base,
          withCredentials: config.withCredentials,
          hasAuthorization: hasAuth,
          authHeaderLength: authHeader ? authHeader.length : 0,
        })
      } else if (!hasAuth && url.includes('/api/') && !url.includes('/api/auth/session')) {
        // Warn if auth is missing for protected routes (even when debug is off)
        console.warn('[API][request] Missing Authorization header for protected route:', {
          method: (config.method || 'get').toUpperCase(),
          url,
          baseURL: base,
        })
      }
    } catch { }

    config.headers = headers
  } catch { }
  return config
})

export const getApiClient = () => axiosInstance

export default axiosInstance



// Utility: ensure session cookie is present before navigating protected UI
// Simplified function that just checks if user is authenticated
export function isUserAuthenticated(): boolean {
  try {
    if (typeof document === 'undefined') return false

    // Check if we have a session cookie
    const hasSession = document.cookie.includes('app_session=')
    if (hasSession) {
      console.log('[isUserAuthenticated] Session cookie exists')
      return true
    }

    // Check if user is authenticated in Firebase
    if (auth?.currentUser) {
      console.log('[isUserAuthenticated] Firebase user authenticated')
      // Set auth_hint cookie as fallback
      try {
        document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax'
        console.log('[isUserAuthenticated] Set auth_hint cookie')
      } catch (e) {
        console.error('[isUserAuthenticated] Failed to set auth_hint cookie:', e)
      }
      return true
    }

    console.log('[isUserAuthenticated] No authentication found')
    return false
  } catch (error) {
    console.error('[isUserAuthenticated] Error checking authentication:', error)
    return false
  }
}

// Light-touch readiness: if we have a Bearer path, skip creating a session. Only return true/false, don't force network.
export async function ensureSessionReady(maxWaitMs: number = 800): Promise<boolean> {
  try {
    // Check if we're in browser environment
    if (typeof document === 'undefined') return false

    console.log('[ensureSessionReady] Starting session check...')

    const hasSession = document.cookie.includes('app_session=')
    if (hasSession) {
      console.log('[ensureSessionReady] Session already exists')
      return true
    }

    // If we have a token path (either cached token or firebase user), proceed without creating a session
    const stored = getStoredIdToken()
    if (stored) {
      console.log('[ensureSessionReady] Bearer token present; skipping session creation')
      return true
    }
    if (!auth?.currentUser) {
      console.error('[ensureSessionReady] No authenticated user found')
      return false
    }

    // Verify user is actually authenticated
    console.log('[ensureSessionReady] User authentication status:', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      isAnonymous: auth.currentUser.isAnonymous
    })

    // Hint cookie to help middleware if needed
    try {
      document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax'
    } catch { }

    // Always get a fresh token from Firebase to ensure validity
    let idToken: string | null = null
    try {
      console.log('[ensureSessionReady] Getting fresh token from Firebase...')
      idToken = await auth.currentUser.getIdToken(true) // Force refresh
      console.log('[ensureSessionReady] Fresh token obtained:', !!idToken)

      // Validate token format (should be a JWT with 3 parts separated by dots)
      if (idToken && !idToken.includes('.')) {
        console.error('[ensureSessionReady] Invalid token format - not a JWT')
        idToken = null
      }

      // Additional validation - check if token has proper JWT structure
      if (idToken && idToken.split('.').length !== 3) {
        console.error('[ensureSessionReady] Invalid JWT structure')
        idToken = null
      }
    } catch (error) {
      console.error('[ensureSessionReady] Failed to get fresh token:', error)

      // If token refresh fails, try to clear stored tokens and retry
      try {
        console.log('[ensureSessionReady] Clearing stored tokens and retrying...')
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')

        // Try one more time with a clean slate
        idToken = await auth.currentUser.getIdToken(true)
        console.log('[ensureSessionReady] Retry token obtained:', !!idToken)
      } catch (retryError) {
        console.error('[ensureSessionReady] Retry also failed:', retryError)
        return false
      }
    }

    if (!idToken) {
      console.error('[ensureSessionReady] No valid ID token available')
      return false
    }

    // Log token info for debugging (without exposing the actual token)
    console.log('[ensureSessionReady] Token info:', {
      length: idToken.length,
      startsWith: idToken.substring(0, 20) + '...',
      parts: idToken.split('.').length
    })

    // Do NOT create a session here; rely on Bearer token path
    return true
  } catch (error) {
    console.error('[ensureSessionReady] Error:', error)
    return false
  }
}

// Response interceptor: on 401, try to refresh session cookie once
// CIRCUIT BREAKER: Prevent infinite 401 loops
let isRefreshing = false
let pendingRequests: Array<() => void> = []
let lastSessionCreateAt = 0
const SESSION_CREATE_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes

// Circuit breaker state for 401 errors
let authFailureCount = 0
let lastAuthFailureTime = 0
const MAX_AUTH_RETRIES = 3 // Maximum consecutive 401 failures before giving up
const AUTH_FAILURE_RESET_WINDOW_MS = 60 * 1000 // Reset failure count after 1 minute of no failures
const AUTH_RETRY_BACKOFF_MS = [500, 1000, 2000] // Exponential backoff: 500ms, 1s, 2s

const getNow = () => Date.now()

const canCreateSession = (): boolean => {
  try {
    const fromStorage = Number(sessionStorage.getItem('session_last_create') || '0')
    const last = Math.max(lastSessionCreateAt, isNaN(fromStorage) ? 0 : fromStorage)
    return getNow() - last > SESSION_CREATE_COOLDOWN_MS
  } catch { return getNow() - lastSessionCreateAt > SESSION_CREATE_COOLDOWN_MS }
}

const markSessionCreated = () => {
  lastSessionCreateAt = getNow()
  try { sessionStorage.setItem('session_last_create', String(lastSessionCreateAt)) } catch { }
}

// Track auth failures to prevent infinite loops
const recordAuthFailure = () => {
  const now = getNow()
  // Reset counter if last failure was more than 1 minute ago
  if (now - lastAuthFailureTime > AUTH_FAILURE_RESET_WINDOW_MS) {
    authFailureCount = 0
  }
  authFailureCount++
  lastAuthFailureTime = now
  console.warn(`[API][circuit-breaker] Auth failure ${authFailureCount}/${MAX_AUTH_RETRIES}`, {
    timestamp: new Date(now).toISOString()
  })
}

// Check if we've exceeded max retries
const hasExceededMaxRetries = (): boolean => {
  return authFailureCount >= MAX_AUTH_RETRIES
}

// Reset auth failure counter (call on successful auth)
const resetAuthFailures = () => {
  if (authFailureCount > 0) {
    console.log('[API][circuit-breaker] Resetting failure count after successful auth')
  }
  authFailureCount = 0
  lastAuthFailureTime = 0
}

// Get backoff delay based on failure count
const getAuthRetryDelay = (): number => {
  const index = Math.min(authFailureCount - 1, AUTH_RETRY_BACKOFF_MS.length - 1)
  return AUTH_RETRY_BACKOFF_MS[index] || 0
}

// Session refresh state management
let isRefreshingSession = false;
let lastSessionRefreshAt = 0;
const SESSION_REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

const refreshSessionIfNeeded = async (): Promise<void> => {
  // Prevent concurrent refresh attempts
  if (isRefreshingSession) {
    if (isApiDebugEnabled()) console.log('[API][session-refresh] Already refreshing, skipping');
    return;
  }

  // Throttle refresh attempts (5-minute cooldown)
  const now = Date.now();
  if (now - lastSessionRefreshAt < SESSION_REFRESH_COOLDOWN_MS) {
    if (isApiDebugEnabled()) console.log('[API][session-refresh] Cooldown active, skipping');
    return;
  }

  try {
    isRefreshingSession = true;
    lastSessionRefreshAt = now;

    if (isApiDebugEnabled()) console.log('[API][session-refresh] Starting automatic session refresh');

    // CRITICAL FIX: Wait for Firebase auth state to initialize
    // Firebase auth state might not be ready immediately after page load
    // Wait up to 2 seconds for auth state to restore from persistence
    let currentUser = auth.currentUser;
    if (!currentUser) {
      // Wait for auth state to restore (Firebase persists auth state)
      const authStateReady = new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve();
        });
        // Timeout after 2 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 2000);
      });
      await authStateReady;
      currentUser = auth.currentUser;
    }

    // CRITICAL FIX: If Firebase user is still null, try to recover from stored token
    // This handles cases where Firebase auth state is lost but session cookie exists
    if (!currentUser) {
      const storedToken = getStoredIdToken();
      if (storedToken) {
        // We have a stored token but no Firebase user
        // This means Firebase auth state was lost but we have a valid session cookie
        // Don't fail - the session cookie should still work
        console.warn('[API][session-refresh] Firebase user is null but stored token exists. Session cookie should still be valid.');
        if (isApiDebugEnabled()) {
          console.log('[API][session-refresh] Skipping refresh - session cookie should still work without Firebase user');
        }
        return;
      } else {
        // No Firebase user and no stored token - user is truly logged out
        if (isApiDebugEnabled()) {
          console.warn('[API][session-refresh] No current user and no stored token, cannot refresh');
        }
        return;
      }
    }

    // Get fresh ID token
    let freshIdToken: string | null = null;
    try {
      freshIdToken = await currentUser.getIdToken(true);
    } catch (tokenError: any) {
      // CRITICAL FIX: If getting ID token fails, don't fail the refresh
      // The session cookie might still be valid
      console.warn('[API][session-refresh] Failed to get fresh ID token, but session cookie may still be valid:', {
        error: tokenError?.message,
        uid: currentUser?.uid
      });

      // Try to use stored token as fallback
      const storedToken = getStoredIdToken();
      if (storedToken) {
        freshIdToken = storedToken;
        console.log('[API][session-refresh] Using stored token as fallback');
      } else {
        // No fallback available
        if (isApiDebugEnabled()) {
          console.warn('[API][session-refresh] No ID token and no stored token, cannot refresh');
        }
        return;
      }
    }

    if (!freshIdToken) {
      if (isApiDebugEnabled()) console.warn('[API][session-refresh] Failed to get fresh ID token');

      // CRITICAL FIX: If we can't get a fresh token, it might be a temporary network issue
      // or the user's refresh token is revoked.
      // We should NOT logout immediately. The session cookie might still be valid.
      // We just stop the *refresh* attempt. The next request will try to use the cookie.
      // If the cookie is valid, it will work. If not, it will 401 again, and we might loop.
      // To prevent looping, we rely on the `isRefreshing` flag and the cooldown.
      return;
    }

    // Call refresh endpoint
    const backendBase = resolvedBaseUrl;
    const refreshResponse = await axios.post(
      `${backendBase}/api/auth/session/refresh`,
      { idToken: freshIdToken },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshIdToken}`
        }
      }
    );

    if (refreshResponse.data?.responseStatus === 'success') {
      if (isApiDebugEnabled()) console.log('[API][session-refresh] Session refreshed successfully', {
        expiresIn: refreshResponse.data?.data?.expiresIn
      });
    } else {
      if (isApiDebugEnabled()) console.warn('[API][session-refresh] Refresh response indicates failure', refreshResponse.data);
    }
  } catch (error: any) {
    // CRITICAL FIX: Log refresh failures for debugging random logouts
    // Don't silently fail - this could be causing the logout issue
    console.warn('[API][session-refresh] Failed to refresh session (CRITICAL - potential logout cause):', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      hasCurrentUser: !!auth.currentUser,
      errorCode: error?.code,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      note: 'Session cookie may still be valid even if refresh fails'
    });

    // CRITICAL FIX: If refresh fails, don't clear the session - let the user continue with existing session
    // The session cookie should still be valid even if refresh fails
    // Only clear session if we get a 401 from the refresh endpoint itself
    if (error?.response?.status === 401) {
      console.error('[API][session-refresh] CRITICAL: Refresh endpoint returned 401 - session may be invalid');
    }
  } finally {
    isRefreshingSession = false;
  }
};

axiosInstance.interceptors.response.use(
  async (response) => {
    try {
      if (isApiDebugEnabled()) console.log('[API][response]', { url: response?.config?.url, status: response?.status })
      const urlStr = String(response?.config?.url || '')
      if (urlStr.includes('/api/auth/logout')) {
        console.log('[API][logout][response]', { status: response?.status, url: response?.config?.url })
      }

      // CIRCUIT BREAKER: Reset failure count on successful response
      resetAuthFailures()

      // Check for session refresh header (automatic refresh when session expires within 3 days)
      // Axios normalizes headers to lowercase, but check both cases for safety
      const refreshHeader = response.headers['x-session-refresh-needed'] ||
        response.headers['X-Session-Refresh-Needed'];
      const refreshNeeded = refreshHeader === 'true';
      if (refreshNeeded && typeof window !== 'undefined') {
        // Refresh session in background (non-blocking)
        refreshSessionIfNeeded().catch(() => {
          // Silently fail - non-critical
        });
      }
    } catch { }
    return response
  },
  async (error) => {
    const original = error?.config || {}
    const status = error?.response?.status
    const errorData = error?.response?.data

    // Check if request was cancelled (user navigated away, component unmounted, etc.)
    const isCancelled = error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.name === 'AbortError' ||
      error?.message?.includes('canceled') ||
      error?.message?.includes('aborted');

    if (isCancelled) {
      // Request was cancelled - this is expected when user navigates away
      // Don't show generic error toast, but we'll handle it in generation slice
      if (isApiDebugEnabled()) {
        console.log('[API][cancelled] Request was cancelled:', {
          url: original?.url,
          reason: 'User navigated away or component unmounted'
        });
      }
      // Reject with a special cancellation marker
      const cancelError = new Error('Request cancelled');
      (cancelError as any).isCancelled = true;
      (cancelError as any).code = 'ERR_CANCELED';
      return Promise.reject(cancelError);
    }

    // Generic error toast (only for non-cancelled errors)
    try { await showFalErrorToast(error); } catch { }
    try {
      const urlStr = String(error?.config?.url || '')
      if (urlStr.includes('/api/auth/logout')) {
        console.error('[API][logout][error]', {
          status: error?.response?.status,
          url: error?.config?.url,
          message: error?.message,
          data: error?.response?.data,
          baseURL: error?.config?.baseURL,
        })
      }
    } catch { }

    if (status !== 401) {
      try {
        if (isApiDebugEnabled()) console.warn('[API][error]', {
          url: original?.url,
          status: error?.response?.status,
          data: error?.response?.data,
        })
      } catch { }
      return Promise.reject(error)
    }

    // CIRCUIT BREAKER: Check if we've exceeded max retries
    recordAuthFailure()
    if (hasExceededMaxRetries()) {
      console.error('[API][circuit-breaker] Max auth retries exceeded - logging out user', {
        failureCount: authFailureCount,
        maxRetries: MAX_AUTH_RETRIES,
        url: original?.url
      })

      // Clear auth data and redirect to login
      try {
        clearAuthData()
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          // Don't redirect if already on public pages
          const isPublic = currentPath === '/' ||
            currentPath.startsWith('/view/Landingpage') ||
            currentPath.startsWith('/view/signup') ||
            currentPath.startsWith('/view/signin') ||
            currentPath.startsWith('/blog') ||
            currentPath.startsWith('/view/pricing') ||
            currentPath.startsWith('/legal/')

          if (!isPublic) {
            console.warn('[API][circuit-breaker] Redirecting to signup after max retries')
            window.location.href = `/view/signup?next=${encodeURIComponent(currentPath)}&toast=AUTH_LOOP_DETECTED`
          }
        }
      } catch (cleanupErr) {
        console.error('[API][circuit-breaker] Error during cleanup:', cleanupErr)
      }

      return Promise.reject(new Error('Maximum authentication retries exceeded. Please log in again.'))
    }

    // Avoid infinite loops - don't retry if already retried
    if (original.__isRetry) {
      console.warn('[API][401] Request already retried once, not retrying again')
      return Promise.reject(error)
    }
    original.__isRetry = true

    // Apply exponential backoff before retry
    const backoffDelay = getAuthRetryDelay()
    if (backoffDelay > 0) {
      console.log(`[API][401] Applying backoff delay: ${backoffDelay}ms before retry ${authFailureCount}/${MAX_AUTH_RETRIES}`)
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
    }

    // Queue requests while a refresh is in progress
    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingRequests.push(resolve))
      return axiosInstance(original)
    }

    try {
      isRefreshing = true
      if (isApiDebugEnabled()) console.log('[API][401][refresh] starting')

      // CRITICAL FIX: Wait for Firebase auth state to initialize
      // Firebase auth state might not be ready immediately after page load
      let currentUser = auth.currentUser
      if (!currentUser) {
        // Wait for auth state to restore (Firebase persists auth state)
        const authStateReady = new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve();
          });
          // Timeout after 1 second
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 1000);
        });
        await authStateReady;
        currentUser = auth.currentUser;
      }

      if (!currentUser) {
        // CRITICAL FIX: If Firebase user is null, try stored token as fallback
        const storedToken = getStoredIdToken();
        if (storedToken) {
          console.log('[API][401][refresh] No Firebase user, but stored token exists - using stored token');
          original.headers = original.headers || {}
          original.headers['Authorization'] = `Bearer ${storedToken}`
          try {
            const retryResp = await axiosInstance(original)
            pendingRequests.forEach((resolve) => resolve())
            pendingRequests = []
            return retryResp
          } catch (retryErr: any) {
            // Fall through to session creation
          }
        }

        // If no stored token either, try retry once (session cookie might still work)
        if (isApiDebugEnabled()) console.warn('[API][401][refresh] no currentUser and no stored token - retry once without session create')
        await new Promise((r) => setTimeout(r, 200))
        return axiosInstance(original)
      }

      // Refresh ID token and retry WITHOUT creating a session
      let freshIdToken: string | null = null;
      try {
        freshIdToken = await currentUser.getIdToken(true);
      } catch (tokenError: any) {
        // CRITICAL FIX: If getting ID token fails, try stored token
        console.warn('[API][401][refresh] Failed to get fresh ID token, trying stored token:', tokenError?.message);
        const storedToken = getStoredIdToken();
        if (storedToken) {
          freshIdToken = storedToken;
        } else {
          // No token available, retry once
          await new Promise((r) => setTimeout(r, 200));
          return axiosInstance(original);
        }
      }

      if (!freshIdToken) {
        if (isApiDebugEnabled()) console.warn('[API][401][refresh] No ID token available - retry once');
        await new Promise((r) => setTimeout(r, 200));
        return axiosInstance(original);
      }

      original.headers = original.headers || {}
      original.headers['Authorization'] = `Bearer ${freshIdToken}`
      try {
        const retryResp = await axiosInstance(original)
        // Resume queued requests
        pendingRequests.forEach((resolve) => resolve())
        pendingRequests = []
        return retryResp
      } catch (retryErr: any) {
        // CRITICAL FIX: Only create session if we haven't done so recently
        // But also check if the error is truly a session issue vs other 401 errors
        const isSessionError = retryErr?.response?.status === 401 &&
          (retryErr?.response?.data?.message?.includes('session') ||
            retryErr?.response?.data?.message?.includes('Unauthorized') ||
            retryErr?.response?.data?.message?.includes('token'));

        if (isSessionError && canCreateSession()) {
          try {
            // Use the same resolved backend base URL as the axios instance
            const backendBase = resolvedBaseUrl
            const sessionResponse = await axios.post(
              `${backendBase}/api/auth/session`,
              { idToken: freshIdToken },
              { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
            )

            if (sessionResponse.status === 200) {
              markSessionCreated()
              if (isApiDebugEnabled()) console.log('[API][401][session-create] created (throttled), retrying original')
              // Retry the original request with new session cookie
              return axiosInstance(original)
            } else {
              if (isApiDebugEnabled()) console.warn('[API][401][session-create] failed with status:', sessionResponse.status)
            }
          } catch (createErr: any) {
            // CRITICAL FIX: Log session creation failures for debugging
            console.error('[API][401][session-create] Failed to create session:', {
              message: createErr?.message,
              status: createErr?.response?.status,
              data: createErr?.response?.data,
              hasIdToken: !!freshIdToken
            })
          }
        } else {
          if (isApiDebugEnabled()) {
            if (!isSessionError) {
              console.log('[API][401][session-create] skipped (not a session error)')
            } else {
              console.log('[API][401][session-create] skipped (cooldown)')
            }
          }
        }
        throw retryErr
      }
    } catch (e) {
      try { if (isApiDebugEnabled()) console.error('[API][401][refresh] failed', e) } catch { }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)


