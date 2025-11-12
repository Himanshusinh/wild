import { getMeCached } from '@/lib/me'

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
    const user = await getMeCached()
    // Use the computed policy flags from backend /me endpoint
    const canToggle = Boolean(user?.canTogglePublicGenerations)
    const forcePublic = Boolean(user?.forcePublicGenerations)
    const serverPref = user?.isPublic
    // If forced public (restricted plans), always true; otherwise use server preference (default true if not set)
    const isPublic = forcePublic ? true : (typeof serverPref === 'boolean' ? serverPref : true)
    cachedAt = now
    cachedIsPublic = isPublic
    cachedCanToggle = canToggle
    cachedForcePublic = forcePublic
    return { isPublic, canToggle, forcePublic }
  } catch {
    // Fallback safe default: public true, cannot toggle (restricted)
    return { isPublic: true, canToggle: false, forcePublic: true }
  }
}

export async function getIsPublic(): Promise<boolean> {
  const pol = await getPublicPolicy()
  return pol.isPublic
}


