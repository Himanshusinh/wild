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

export function toThumbUrl(urlOrPath: string, opts?: { w?: number; q?: number }): string {
  const path = toZataPath(urlOrPath)
  if (!path) return ''
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
  const w = opts?.w ?? 512
  const q = opts?.q ?? 60
  return `${base}/api/proxy/thumb/${encodeURIComponent(path)}?w=${w}&q=${q}`
}

export function toMediaProxy(urlOrPath: string): string {
  const path = toZataPath(urlOrPath)
  if (!path) return ''
  return `/api/proxy/media/${encodeURIComponent(path)}`
}
