export function resolveBackendBase(req: Request): string {
  // Preferred explicit backend base (server-only)
  const explicit = process.env.API_BASE_URL || process.env.BACKEND_BASE_URL || 'https://api.wildmindai.com';
  const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.wildmindai.com';

  // Choose explicit if present, else public
  let base = explicit || publicBase || 'http://localhost:5000';

  // Prevent recursion: if API base host equals current host, refuse and fall back to localhost
  try {
    const currentHost = (req.headers as any).get?.('host') || '';
    const apiHost = new URL(base).host;
    if (currentHost && apiHost && apiHost === currentHost) {
      // If BACKEND_FALLBACK_BASE is provided, use it; else fallback to localhost
      const fallback = process.env.BACKEND_FALLBACK_BASE || 'http://localhost:5000';
      base = fallback;
    }
  } catch {
    // ignore parsing errors
  }

  return base.replace(/\/$/, '');
}


