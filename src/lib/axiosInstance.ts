import axios from 'axios'
import { auth } from './firebase'

// Try to extract an ID token from localStorage in a tolerant way
const getStoredIdToken = (): string | null => {
  try {
    const directToken = localStorage.getItem('authToken')
    if (directToken) return directToken

    const userString = localStorage.getItem('user')
    if (userString) {
      const userObj = JSON.parse(userString)
      return userObj?.idToken || userObj?.token || null
    }
  } catch (err) {
    // Access to localStorage may fail in some environments; ignore
  }
  return null
}

// Centralized axios instance configured to send cookies and optional Authorization header
const resolvedBaseUrl = (() => {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
  return raw.length > 0 ? raw : 'http://localhost:5000'
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
axiosInstance.interceptors.request.use((config) => {
  try {
    // Use backend baseURL for all calls; session is now direct to backend
    const url = typeof config.url === 'string' ? config.url : ''

    // For backend data endpoints (credits, generations), attach Bearer id token so backend accepts without cookies
    if (url.startsWith('/api/credits/') || url.startsWith('/api/generations')) {
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

    // Attach bearer token for protected backend routes when cookies may be missing (ngrok)
    try {
      const raw = typeof config.url === 'string' ? config.url : ''
      const base = (config.baseURL as string) || axiosInstance.defaults.baseURL || ''
      const full = new URL(raw, base)
      const path = full.pathname || ''
      const isProtectedApi = path.startsWith('/api/') && !path.startsWith('/api/auth/')
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
        return Promise.reject(error)
      }
      const freshIdToken = await currentUser.getIdToken(true)
      // Refresh session via same-origin Next.js proxy to avoid ngrok CORS
      await axios.post(
        '/api/auth/session',
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

