export function resolveBackendBase(req: Request): string {
  // Use NEXT_PUBLIC_API_BASE_URL (must be set in environment variables)
  // Server-side can also use API_BASE_URL as fallback
  const explicit = process.env.API_BASE_URL;
  const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Choose explicit if present, else public (no hardcoded fallback)
  let base = explicit || publicBase || '';

  // Smart fallback for localhost development if env var is missing
  if (!base && process.env.NODE_ENV === 'development') {
    base = 'http://localhost:5000';
    console.log('[serverApiBase] Using fallback:', base);
  }

  // Prevent recursion: if API base host equals current host, refuse and fall back to localhost
  try {
    const currentHost = (req.headers as any).get?.('host') || '';
    if (base && currentHost) {
      const apiHost = new URL(base).host;
      if (apiHost === currentHost) {
        // If BACKEND_FALLBACK_BASE is provided, use it
        const fallback = process.env.BACKEND_FALLBACK_BASE;
        if (fallback) {
          base = fallback;
        } else if (process.env.NODE_ENV === 'development') {
          base = 'http://localhost:5000';
        }
      }
    }
  } catch {
    // ignore parsing errors
  }

  return base.replace(/\/$/, '');
}


