/** Fallback chain when Zata style thumbnails return 403 or are missing. */

const POLLINATIONS_MAX_PROMPT_LEN = 280;

function stableSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100_000_000;
}

function truncateForUrl(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * On-demand preview (used only when the primary CDN image fails).
 * @see https://pollinations.ai/
 */
export function buildPollinationsStylePreviewUrl(prompt: string, seedKey: string): string {
  const seed = stableSeed(seedKey);
  const q = truncateForUrl(prompt, POLLINATIONS_MAX_PROMPT_LEN);
  const encoded = encodeURIComponent(q);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=384&seed=${seed}&nologo=true`;
}

export function styleNameSvgDataUrl(label: string): string {
  const text = escapeXml(truncateForUrl(label, 42));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14141c"/>
      <stop offset="100%" stop-color="#252532"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <text x="400" y="300" fill="rgba(255,255,255,0.45)" font-family="system-ui,Segoe UI,sans-serif" font-size="26" font-weight="600" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Text for Pollinations when the primary style thumbnail URL fails (403, etc.). */
export function styleGridRowFallbackPrompt(row: {
  name: string;
  description?: string;
  prompt?: string;
}): string | undefined {
  if (typeof row.prompt === 'string' && row.prompt.trim()) return row.prompt.trim();
  const name = row.name?.trim();
  const desc = typeof row.description === 'string' ? row.description.trim() : '';
  if (name && desc) return `Illustration in ${name} style: ${desc}`;
  if (name) return `Illustration in ${name} style, high quality, detailed`;
  return undefined;
}
