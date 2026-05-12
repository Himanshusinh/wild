/** True if mask has bright (painted) pixels; EraseFrame uses white on black. */
export async function maskDataUrlHasPaintedRegion(
  dataUrl: string,
): Promise<boolean> {
  if (!dataUrl || !String(dataUrl).startsWith("data:")) return false;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = Math.min(Math.max(1, img.naturalWidth), 512);
        const h = Math.min(Math.max(1, img.naturalHeight), 512);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const a = data[i + 3] ?? 0;
          if (a > 12 && r + g + b > 380) {
            resolve(true);
            return;
          }
        }
        resolve(false);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

// Normalize any Next.js optimized image URL back to the original Zata (or source) URL.
// This prevents passing `/_next/image?url=...` wrappers to the backend, which can't use them.
export function normalizeEditImageUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  let url = raw;
  try {
    // If the URL is a direct Zata storage URL, route it through our media proxy.
    // This avoids cross-origin/auth edge cases (esp. for SVG outputs).
    if (url.includes("idr01.zata.ai/devstoragev1/")) {
      const idx = url.indexOf("idr01.zata.ai/devstoragev1/");
      if (idx !== -1) {
        const after = url.substring(idx + "idr01.zata.ai/devstoragev1/".length);
        if (after && !url.startsWith("/api/proxy/media/")) {
          return `/api/proxy/media/${encodeURIComponent(after)}`;
        }
      }
    }

    if (url.includes("/_next/image")) {
      // Support both absolute and relative URLs
      const base =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "https://wildmindai.com";
      const parsed = new URL(url, base);
      const inner = parsed.searchParams.get("url");
      if (inner) {
        return decodeURIComponent(inner);
      }
    }
  } catch {
    // Fall through to returning the original URL
  }
  return url;
}

// Detect SVG outputs (vectorize feature). next/image with `fill` + `unoptimized`
// can fail to display SVGs that lack intrinsic width/height, so we fall back to
// a plain <img> element for these outputs.
export function isSvgUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const lower = String(raw).toLowerCase();
    if (lower.startsWith("data:image/svg")) return true;
    const path = lower.split("?")[0].split("#")[0];
    return path.endsWith(".svg");
  } catch {
    return false;
  }
}

export function isInlineImageUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const v = String(raw);
  return v.startsWith("data:image/") || v.startsWith("blob:");
}
