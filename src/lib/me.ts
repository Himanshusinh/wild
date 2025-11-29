import { getApiClient } from '@/lib/axiosInstance'

type MePayload = any

let meCachedAt = 0
let meCache: MePayload | null = null
let inFlight: Promise<MePayload> | null = null

// Increase TTL to reduce repeated calls across pages
const TTL_MS = 120000 // 120 seconds

const STORAGE_KEY = 'me_cache'

function readFromStorage(): { at: number; data: MePayload } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.at === 'number') return parsed
  } catch {}
  return null
}

function writeToStorage(at: number, data: MePayload) {
  const payload = JSON.stringify({ at, data })
  try { sessionStorage.setItem(STORAGE_KEY, payload) } catch {}
  try { localStorage.setItem(STORAGE_KEY, payload) } catch {}
}

export async function getMeCached(): Promise<MePayload> {
  const now = Date.now()
  // Memory cache first
  if (meCache && (now - meCachedAt < TTL_MS)) {
    return meCache
  }

  // Cross-page storage cache fallback
  try {
    const stored = readFromStorage()
    if (stored && now - stored.at < TTL_MS) {
      meCache = stored.data
      meCachedAt = stored.at
      return meCache
    }
  } catch {}

  // Cross-module in-flight dedupe via window global
  try {
    const g: any = typeof window !== 'undefined' ? (window as any) : undefined
    if (g && g.__meInFlight && typeof g.__meInFlight.then === 'function') {
      return g.__meInFlight as Promise<MePayload>
    }
  } catch {}

  if (inFlight) {
    return inFlight
  }
  const api = getApiClient()
  inFlight = api.get('/api/auth/me')
    .then((res) => {
      const payload = res?.data?.data?.user || res?.data?.user || res?.data
      meCache = payload || null
      meCachedAt = Date.now()
      try { writeToStorage(meCachedAt, meCache) } catch {}
      return payload
    })
    .catch((error: any) => {
      // CRITICAL FIX: If /api/auth/me returns 401, clear cache and cookies
      // This handles the case where cookie exists but backend rejects it
      if (error?.response?.status === 401) {
        const errorMessage = error?.response?.data?.message || error?.message || '';
        
        // Check if error is due to cookie not being sent (domain issue)
        // If "Cookie not sent" is in the error, it means the browser didn't send the cookie
        // This is likely a domain configuration issue, NOT an invalid cookie
        // So we should NOT clear the cookie, as that would force the user to log in again unnecessarily
        const isDomainIssue = errorMessage.includes('Cookie not sent') || 
                              errorMessage.includes('No session token');
        
        if (isDomainIssue) {
          console.warn('[getMeCached] 401 due to cookie domain issue - cookie not sent to backend', {
            hasCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false,
            error: errorMessage
          });
          // Don't clear cookies - let user know they need to log in again or fix domain
        } else {
          // Cookie was sent but rejected - clear it
          console.warn('[getMeCached] 401 Unauthorized - clearing invalid cookies', {
            error: errorMessage
          });
          
          // Clear cache
          meCache = null
          meCachedAt = 0
          try { 
            sessionStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(STORAGE_KEY)
          } catch {}
          
          // Clear expired/invalid cookies (they exist but backend rejects them)
          if (typeof document !== 'undefined') {
            try {
              const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
              // Clear all cookie variants
              document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
              document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
              document.cookie = `app_session=; ${expired}; SameSite=Lax`
              document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
              console.log('[getMeCached] Cleared invalid/expired cookies');
            } catch (e) {
              console.warn('[getMeCached] Failed to clear cookies:', e);
            }
          }
        }
      }
      throw error
    })
    .finally(() => {
      inFlight = null
      try { const g: any = typeof window !== 'undefined' ? (window as any) : undefined; if (g) g.__meInFlight = null } catch {}
    })
  try { const g: any = typeof window !== 'undefined' ? (window as any) : undefined; if (g) g.__meInFlight = inFlight } catch {}
  return inFlight
}

export function clearMeCache() {
  meCache = null
  meCachedAt = 0
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
