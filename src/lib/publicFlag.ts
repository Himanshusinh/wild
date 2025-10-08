import { getApiClient } from '@/lib/axiosInstance'

let cachedAt = 0
let cachedIsPublic: boolean | null = null
let cachedCanToggle: boolean | null = null
let cachedForcePublic: boolean | null = null

export async function getPublicPolicy(): Promise<{ isPublic: boolean; canToggle: boolean; forcePublic: boolean }> {
  const now = Date.now()
  if (cachedIsPublic !== null && now - cachedAt < 10000) {
    return { isPublic: cachedIsPublic!, canToggle: Boolean(cachedCanToggle), forcePublic: Boolean(cachedForcePublic) }
  }
  try {
    const api = getApiClient()
    const res = await api.get('/api/auth/me')
    const user = res?.data?.data?.user || res?.data?.user || res?.data
    const canToggle = Boolean(user?.canTogglePublicGenerations === true)
    const forcePublic = Boolean(user?.forcePublicGenerations === true)
    const serverPref = user?.isPublic
    const isPublic = forcePublic ? true : (typeof serverPref === 'boolean' ? serverPref : true)
    cachedAt = now
    cachedIsPublic = isPublic
    cachedCanToggle = canToggle
    cachedForcePublic = forcePublic
    return { isPublic, canToggle, forcePublic }
  } catch {
    // Fallback safe default: public true
    return { isPublic: true, canToggle: false, forcePublic: true }
  }
}

export async function getIsPublic(): Promise<boolean> {
  const pol = await getPublicPolicy()
  return pol.isPublic
}


