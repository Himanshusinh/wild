/**
 * Direct Zata object URLs for public style previews:
 * `{storage}/public/styles/{stem}.avif`
 *
 * Zata object **stems use hyphens** (e.g. `neon-noir`, `oil-painting`). Catalog / Redux
 * **values use underscores** (`neon_noir`, `oil_painting`) — we map `_` → `-` for the path.
 *
 * `NEXT_PUBLIC_ZATA_PREFIX` should be the bucket root, e.g.
 * `https://idr01.zata.ai/devstoragev1` (no trailing path after the bucket).
 */

const DEFAULT_ZATA_BASE = 'https://idr01.zata.ai/devstoragev1';

export function zataStorageBaseUrl(): string {
  const raw =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ZATA_PREFIX) ||
    DEFAULT_ZATA_BASE;
  return String(raw).trim().replace(/\/+$/, '');
}

/** Normalize Redux / catalog `value` to the filename stem under `public/styles/`. */
export function zataPublicStyleFileSlug(styleValue: string): string {
  const s = String(styleValue || 'none')
    .toLowerCase()
    .trim()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return s || 'none';
}

/** Filename stem as stored on Zata (hyphens between words). */
export function zataPublicStyleObjectStem(styleValue: string): string {
  return zataPublicStyleFileSlug(styleValue).replace(/_/g, '-');
}

/** Direct Zata URL: `{prefix}/public/styles/{stem}.avif` */
export function zataPublicStyleThumbnailAvifUrl(styleValue: string): string {
  const stem = zataPublicStyleObjectStem(styleValue);
  return `${zataStorageBaseUrl()}/public/styles/${stem}.avif`;
}
