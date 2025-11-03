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
