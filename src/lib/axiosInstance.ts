import axios from 'axios'
import { auth } from './firebase'

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

// Attach device headers; rely on httpOnly session cookies for auth
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
          if (isApiDebugEnabled()) console.log('[API][request-delay] auth_hint present, delaying 250ms for session cookie')
          await new Promise((r) => setTimeout(r, 250))
        }
      } catch {}
      const token = getStoredIdToken()
      if (token) {
        const headers: any = config.headers || {}
        headers['Authorization'] = `Bearer ${token}`
        config.headers = headers
      }
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

    // Attach bearer token for protected backend routes when cookies may be missing (ngrok/first-load)
    try {
      const raw = typeof config.url === 'string' ? config.url : ''
      const base = (config.baseURL as string) || axiosInstance.defaults.baseURL || ''
      const full = new URL(raw, base)
      const path = full.pathname || ''
      // Treat most backend routes as protected to reduce 401s in early post-auth; allow session creation route to go without bearer
      const isProtectedApi = path.startsWith('/api/') && path !== '/api/auth/session'
      // Gentle delay for protected APIs when auth just completed and Set-Cookie may lag
      if (isProtectedApi) {
        try {
          const hasHint = document.cookie.includes('auth_hint=')
          const hasSession = document.cookie.includes('app_session=')
          if (hasHint && !hasSession) {
            if (isApiDebugEnabled()) console.log('[API][request-delay] protected call while auth_hint present, delaying 250ms', { path })
            await new Promise((r) => setTimeout(r, 250))
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
        }
      }
    } catch {}

    if (isApiDebugEnabled()) {
      try {
        const base = (config.baseURL as string) || axiosInstance.defaults.baseURL
        const authHeader = (config.headers as any)?.Authorization
        console.log('[API][request]', {
          method: (config.method || 'get').toUpperCase(),
          url,
          baseURL: base,
          withCredentials: config.withCredentials,
          hasAuthorization: Boolean(authHeader),
        })
      } catch {}
    }

    config.headers = headers
  } catch {}
  return config
})

export const getApiClient = () => axiosInstance

export default axiosInstance



// Utility: ensure session cookie is present before navigating protected UI
// Helper function to clear all authentication data
export function clearAuthData() {
  try {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_hint')
    console.log('[clearAuthData] Cleared all authentication data')
  } catch (error) {
    console.error('[clearAuthData] Error clearing auth data:', error)
  }
}

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
    
    // Check if user is authenticated
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
    
    // Quick fallback: if we have a user but session creation is problematic, 
    // try to proceed anyway with just the auth_hint cookie
    try {
      document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax'
      console.log('[ensureSessionReady] Set auth_hint cookie as quick fallback')
    } catch (cookieError) {
      console.error('[ensureSessionReady] Failed to set auth_hint cookie:', cookieError)
    }
    
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
    
    // Create session directly with backend to avoid proxy issues
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      console.log('[ensureSessionReady] Creating session with backend:', backendBase)
      console.log('[ensureSessionReady] Token length:', idToken.length)
      console.log('[ensureSessionReady] Token preview:', idToken.substring(0, 50) + '...')
      
      const requestBody = { idToken }
      console.log('[ensureSessionReady] Request body prepared:', { idTokenLength: idToken.length })
      
      const sessionResponse = await fetch(`${backendBase}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookie handling
        body: JSON.stringify(requestBody)
      })
      
      console.log('[ensureSessionReady] Session response status:', sessionResponse.status)
      console.log('[ensureSessionReady] Session response headers:', Object.fromEntries(sessionResponse.headers.entries()))
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        console.error('[ensureSessionReady] Session creation failed:', {
          status: sessionResponse.status,
          statusText: sessionResponse.statusText,
          error: errorText,
          url: `${backendBase}/api/auth/session`,
          method: 'POST'
        })
        throw new Error(`Session creation failed with status ${sessionResponse.status}: ${errorText}`)
      }
      
      const responseText = await sessionResponse.text()
      console.log('[ensureSessionReady] Session response body:', responseText)
      console.log('[ensureSessionReady] Session created successfully')
    } catch (error: any) {
      console.error('[ensureSessionReady] Direct fetch failed, trying axios fallback...')
      
      // Try axios as fallback
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
        console.log('[ensureSessionReady] Trying axios fallback to:', `${backendBase}/api/auth/session`)
        
        const axiosResponse = await axiosInstance.post('/api/auth/session', { idToken })
        console.log('[ensureSessionReady] Axios fallback successful:', axiosResponse.status)
        
        // Set auth_hint cookie as additional fallback
        try {
          document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax'
          console.log('[ensureSessionReady] Set auth_hint cookie as fallback')
        } catch (cookieError) {
          console.error('[ensureSessionReady] Failed to set auth_hint cookie:', cookieError)
        }
        
      } catch (axiosError: any) {
        console.error('[ensureSessionReady] Axios fallback also failed:', axiosError)
        
        // As a final fallback, set auth_hint cookie to help middleware allow the request
        try {
          document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax'
          console.log('[ensureSessionReady] Set auth_hint cookie as final fallback')
        } catch (cookieError) {
          console.error('[ensureSessionReady] Failed to set auth_hint cookie:', cookieError)
        }
        
        console.error('[ensureSessionReady] All session creation methods failed:', {
          directFetchError: error.message,
          axiosError: axiosError.message,
          tokenLength: idToken.length
        })
        
        // Even if session creation fails, if we have a valid user and token,
        // we can try to proceed with just the auth_hint cookie
        console.log('[ensureSessionReady] Attempting to proceed with auth_hint only...')
        return true // Return true to allow the request to proceed
      }
    }
    
    // Wait for cookie to be set
    console.log('[ensureSessionReady] Waiting for session cookie...')
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      if (document.cookie.includes('app_session=')) {
        console.log('[ensureSessionReady] Session cookie found!')
        return true
      }
      await new Promise(r => setTimeout(r, 50))
    }
    
    const finalResult = document.cookie.includes('app_session=')
    console.log('[ensureSessionReady] Final result:', finalResult)
    return finalResult
  } catch (error) {
    console.error('[ensureSessionReady] Error:', error)
    return false
  }
}

// Response interceptor: on 401, try to refresh session cookie once
let isRefreshing = false
let pendingRequests: Array<() => void> = []

axiosInstance.interceptors.response.use(
  (response) => {
    try {
      if (isApiDebugEnabled()) console.log('[API][response]', { url: response?.config?.url, status: response?.status })
      const urlStr = String(response?.config?.url || '')
      if (urlStr.includes('/api/auth/logout')) {
        console.log('[API][logout][response]', { status: response?.status, url: response?.config?.url })
      }
    } catch {}
    return response
  },
  async (error) => {
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
        if (isApiDebugEnabled()) console.warn('[API][401][refresh] no currentUser')
        // If session cookie might be racing to be set, wait briefly then retry once
        await new Promise((r) => setTimeout(r, 300))
        return axiosInstance(original)
      }
      const freshIdToken = await currentUser.getIdToken(true)
      // Refresh session directly with backend
      const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      await axiosInstance.post(
        `${backendBase}/api/auth/session`,
        { idToken: freshIdToken },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      )
      if (isApiDebugEnabled()) console.log('[API][401][refresh] success, retrying original')

      // Resume queued requests
      pendingRequests.forEach((resolve) => resolve())
      pendingRequests = []
      return axiosInstance(original)
    } catch (e) {
      try { if (isApiDebugEnabled()) console.error('[API][401][refresh] failed', e) } catch {}
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

