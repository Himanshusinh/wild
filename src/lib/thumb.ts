
export function toZataPath(urlOrPath: string): string {
  if (!urlOrPath) return ''
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/').replace(/\/$/, '/')
  // If the URL starts with the known Zata bucket prefix, strip it
  if (urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length)
  // If it's an absolute URL but not Zata, do not attempt to treat it as a path
  try {
    const u = new URL(urlOrPath)
    // Not our Zata host/bucket -> no path available for proxy/thumbnail
    if (!u.href.startsWith(ZATA_PREFIX)) return ''
  } catch {
    // It's a relative path (already a Zata-style path) -> pass through
    return urlOrPath
  }
  return ''
}

export function toThumbUrl(urlOrPath: string, opts?: { w?: number; q?: number; fmt?: 'auto' | 'webp' | 'avif'; t?: number }): string {
  const path = toZataPath(urlOrPath)
  if (!path) return ''
  const w = opts?.w ?? 512
  const q = opts?.q ?? 60
  const fmt = opts?.fmt
  const t = typeof opts?.t === 'number' ? opts?.t : undefined
  const params = new URLSearchParams()
  params.set('w', String(w))
  params.set('q', String(q))
  if (fmt) params.set('fmt', fmt)
  if (typeof t === 'number') params.set('t', String(t))
  // Use same-origin Next.js API route to avoid cross-origin issues
  return `/api/proxy/thumb/${encodeURIComponent(path)}?${params.toString()}`
}

export function toMediaProxy(urlOrPath: string): string {
  const path = toZataPath(urlOrPath)
  if (!path) return ''
  return `/api/proxy/media/${encodeURIComponent(path)}`
}

export function toResourceProxy(urlOrPath: string): string {
  const path = toZataPath(urlOrPath)
  if (!path) return urlOrPath
  return `/api/proxy/resource/${encodeURIComponent(path)}`
}

/**
 * Prefer direct CDN URL for full-resolution preview to avoid the extra proxy hop.
 * - If given a Zata path, build a direct URL using NEXT_PUBLIC_ZATA_PREFIX
 * - If given a Zata absolute URL, return it as-is
 * - Otherwise, return the original urlOrPath
 */
export function toDirectUrl(urlOrPath: string): string {
  if (!urlOrPath) return ''
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/').replace(/\/$/, '/')
  try {
    const u = new URL(urlOrPath)
    // If it's already our Zata CDN, just return it
    if (u.href.startsWith(ZATA_PREFIX)) return u.href
    // Not our CDN; just return the original
    return urlOrPath
  } catch {
    // It's likely a Zata-style relative path; construct a direct URL
    return ZATA_PREFIX + urlOrPath.replace(/^\//, '')
  }
}
