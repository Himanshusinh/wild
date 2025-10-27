import { getApiClient } from '@/lib/axiosInstance'

type MePayload = any

let meCachedAt = 0
let meCache: MePayload | null = null
let inFlight: Promise<MePayload> | null = null

const TTL_MS = 15000 // 15 seconds

export async function getMeCached(): Promise<MePayload> {
  const now = Date.now()
  if (meCache && (now - meCachedAt < TTL_MS)) {
    return meCache
  }
  if (inFlight) {
    return inFlight
  }
  const api = getApiClient()
  inFlight = api.get('/api/auth/me')
    .then((res) => {
      const payload = res?.data?.data?.user || res?.data?.user || res?.data
      meCache = payload || null
      meCachedAt = Date.now()
      return payload
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

export function clearMeCache() {
  meCache = null
  meCachedAt = 0
}
