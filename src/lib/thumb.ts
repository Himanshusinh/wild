
export function toZataPath(urlOrPath: string): string {
  if (!urlOrPath) return ''
  // Never attempt to proxy local object/data URLs
  // (If these get encoded into /api/proxy/media/* they will fail with 403.)
  const lowered = urlOrPath.toLowerCase()
  if (lowered.startsWith('blob:') || lowered.startsWith('data:')) return ''
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/')

  // Handle proxy URLs: /api/proxy/resource/... or /api/proxy/media/...
  if (urlOrPath.startsWith('/api/proxy/resource/')) {
    const encodedPath = urlOrPath.substring('/api/proxy/resource/'.length)
    try {
      return decodeURIComponent(encodedPath)
    } catch {
      return encodedPath // If decoding fails, return as-is
    }
  }
  if (urlOrPath.startsWith('/api/proxy/media/')) {
    const encodedPath = urlOrPath.substring('/api/proxy/media/'.length)
    try {
      return decodeURIComponent(encodedPath)
    } catch {
      return encodedPath // If decoding fails, return as-is
    }
  }
  if (urlOrPath.startsWith('/api/proxy/thumb/')) {
    const encodedPath = urlOrPath.substring('/api/proxy/thumb/'.length).split('?')[0] // Remove query params
    try {
      return decodeURIComponent(encodedPath)
    } catch {
      return encodedPath // If decoding fails, return as-is
    }
  }

  // If the URL starts with the known Zata bucket prefix, strip it
  if (ZATA_PREFIX && urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length)
  // If it's an absolute URL but not Zata, do not attempt to treat it as a path
  try {
    const u = new URL(urlOrPath)
    // Not our Zata host/bucket -> no path available for proxy/thumbnail
    if (!ZATA_PREFIX || !u.href.startsWith(ZATA_PREFIX)) return ''
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
  if (!urlOrPath) return ''
  const lowered = urlOrPath.toLowerCase()
  if (lowered.startsWith('blob:') || lowered.startsWith('data:')) return ''
  const path = toZataPath(urlOrPath)
  if (!path) return ''
  return `/api/proxy/media/${encodeURIComponent(path)}`
}

export function toResourceProxy(urlOrPath: string): string {
  if (!urlOrPath) return ''
  const path = toZataPath(urlOrPath)
  if (!path) {
    // If it's an absolute external URL, proxy it via /api/proxy/external to avoid CORS
    if (/^https?:\/\//i.test(urlOrPath)) {
      return `/api/proxy/external?url=${encodeURIComponent(urlOrPath)}`
    }
    return urlOrPath
  }
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
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/')
  try {
    const u = new URL(urlOrPath)
    // If it's already our Zata CDN, just return it
    if (u.href.startsWith(ZATA_PREFIX)) return u.href
    // Not our CDN; just return the original
    return urlOrPath
  } catch {
    // It's likely a Zata-style relative path; construct a URL that Next/Image accepts.
    const cleanPath = urlOrPath.replace(/^\//, '')
    if (ZATA_PREFIX) {
      // Prefer absolute CDN URL when prefix is configured
      return ZATA_PREFIX + cleanPath
    }
    // Fallback: go through our resource proxy with a leading slash so Next/Image is happy
    return `/api/proxy/resource/${encodeURIComponent(cleanPath)}`
  }
}
