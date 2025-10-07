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
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    // Suppress ngrok browser warning HTML page so API returns JSON
    'ngrok-skip-browser-warning': 'true'
  }
})

// Attach device headers; rely on httpOnly session cookies for auth
axiosInstance.interceptors.request.use((config) => {
  try {
    // Route only session endpoint via same-origin Next.js API to ensure cookies are set
    const url = typeof config.url === 'string' ? config.url : ''
    if (url.startsWith('/api/auth/session')) {
      // Override baseURL so the request is same-origin (Next.js app) and proxied server-side
      config.baseURL = ''
    }

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
  (response) => response,
  async (error) => {
    const original = error?.config || {}
    const status = error?.response?.status

    if (status !== 401) {
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
      const currentUser = auth.currentUser
      if (!currentUser) {
        return Promise.reject(error)
      }
      const freshIdToken = await currentUser.getIdToken(true)
      // Use same-origin Next.js proxy so cookies are set on this domain
      await axios.post(
        '/api/auth/session',
        { idToken: freshIdToken },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      )

      // Resume queued requests
      pendingRequests.forEach((resolve) => resolve())
      pendingRequests = []
      return axiosInstance(original)
    } catch (e) {
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

