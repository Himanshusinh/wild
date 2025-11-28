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
const resolvedBaseUrl = (() => {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
  return raw.length > 0 ? raw : 'https://api-gateway-services-wildmind.onrender.com'
})()

const axiosInstance = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
  timeout: 300000, // 5 minutes timeout for long-running requests like video generation
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
  } catch {}
  return process.env.NEXT_PUBLIC_API_DEBUG === 'true'
}

// Attach device headers; rely on Bearer tokens primarily (session cookie is optional fallback)
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Use backend baseURL for all calls; session is now direct to backend
    const url = typeof config.url === 'string' ? config.url : ''

  // For backend data endpoints (credits, generations, auth/me), attach Bearer id token so backend accepts without cookies
  if (url.startsWith('/api/credits/') || url.startsWith('/api/generations') || url === '/api/auth/me') {
      // Gentle delay if session cookie is racing to be set after auth
      try {
        const hasHint = document.cookie.includes('auth_hint=')
        const hasSession = document.cookie.includes('app_session=')
        if (hasHint && !hasSession) {
          if (isApiDebugEnabled()) console.log('[API][request-delay] auth_hint present, delaying 100ms for session cookie')
          await new Promise((r) => setTimeout(r, 100))
        }
      } catch {}
      const token = getStoredIdToken()
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
      } catch {}
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
    } catch {}

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
        } catch {}
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
    } catch {}

    config.headers = headers
  } catch {}
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
    } catch {}
    
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
let isRefreshing = false
let pendingRequests: Array<() => void> = []
let lastSessionCreateAt = 0
const SESSION_CREATE_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
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
  try { sessionStorage.setItem('session_last_create', String(lastSessionCreateAt)) } catch {}
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

    // Get current Firebase user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (isApiDebugEnabled()) console.warn('[API][session-refresh] No current user, cannot refresh');
      return;
    }

    // Get fresh ID token
    const freshIdToken = await currentUser.getIdToken(true);
    if (!freshIdToken) {
      if (isApiDebugEnabled()) console.warn('[API][session-refresh] Failed to get fresh ID token');
      return;
    }

    // Call refresh endpoint
    const backendBase = resolvedBaseUrl;
    const refreshResponse = await axios.post(
      `${backendBase}/api/auth/session/refresh`,
      { idToken: freshIdToken },
      { 
        withCredentials: true, 
        headers: { 'Content-Type': 'application/json' } 
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
    console.warn('[API][session-refresh] Failed to refresh session:', {
      message: error?.message,
      status: error?.response?.status,
      hasCurrentUser: !!auth.currentUser,
      errorCode: error?.code,
      timestamp: new Date().toISOString()
    });
    
    // If refresh fails, don't clear the session - let the user continue with existing session
    // The session cookie should still be valid even if refresh fails
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
    } catch {}
    return response
  },
  async (error) => {
    try { await showFalErrorToast(error); } catch {}
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
    } catch {}
    const original = error?.config || {}
    const status = error?.response?.status

    if (status !== 401) {
      try {
        if (isApiDebugEnabled()) console.warn('[API][error]', {
          url: original?.url,
          status: error?.response?.status,
          data: error?.response?.data,
        })
      } catch {}
      return Promise.reject(error)
    }

    // Avoid infinite loops
    if (original.__isRetry) {
      return Promise.reject(error)
    }
    original.__isRetry = true

    // Queue requests while a refresh is in progress
    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingRequests.push(resolve))
      return axiosInstance(original)
    }

    try {
      isRefreshing = true
      if (isApiDebugEnabled()) console.log('[API][401][refresh] starting')
      const currentUser = auth.currentUser
      if (!currentUser) {
        if (isApiDebugEnabled()) console.warn('[API][401][refresh] no currentUser - retry once without session create')
        await new Promise((r) => setTimeout(r, 200))
        return axiosInstance(original)
      }
      // Refresh ID token and retry WITHOUT creating a session
      const freshIdToken = await currentUser.getIdToken(true)
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
      try { if (isApiDebugEnabled()) console.error('[API][401][refresh] failed', e) } catch {}
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)


