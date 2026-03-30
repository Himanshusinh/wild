"use client";

import { useEffect, useState } from "react";
import InfiniteCanvas from "./InfiniteCanvas";

/** Ensure marketing / iframe targets use `/embed` so COEP does not block framing (wildmindcanvas/next.config.ts). */
function normalizeStudioEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const p = u.pathname.replace(/\/+$/, "") || "/";
    if (p === "/" || p === "") {
      u.pathname = "/embed";
    } else if (!p.startsWith("/embed")) {
      u.pathname = `/embed${p.startsWith("/") ? p : `/${p}`}`;
    }
    return u.toString();
  } catch {
    return raw;
  }
}

/** Full URL copied from canvas → Share → “Homepage showcase” (view-only, `/embed`, `showcase=1`). */
const SHOWCASE_URL_RAW = process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL?.trim() ?? "";
const SHOWCASE_URL = SHOWCASE_URL_RAW ? normalizeStudioEmbedUrl(SHOWCASE_URL_RAW) : "";

/** Legacy: iframe-only embed URL. */
const LEGACY_EMBED_RAW = process.env.NEXT_PUBLIC_WILDMIND_STUDIO_EMBED_URL?.trim() ?? "";
const LEGACY_EMBED_URL = LEGACY_EMBED_RAW ? normalizeStudioEmbedUrl(LEGACY_EMBED_RAW) : "";

/** Iframe in-page by default; set to `false` or `0` only if the browser blocks the embed. */
const SHOWCASE_IFRAME_DISABLED =
  process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_IFRAME === "0" ||
  process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_IFRAME === "false";
const SHOWCASE_USE_IFRAME = !SHOWCASE_IFRAME_DISABLED;

function studioOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "https://wildmindai.com";
  }
}

/** `localhost` and `127.0.0.1` are different origins; match iframe host to the marketing page. */
function alignEmbedHostWithParent(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const u = new URL(url);
    const h = window.location.hostname;
    if (h === "localhost" && u.hostname === "127.0.0.1") u.hostname = "localhost";
    else if (h === "127.0.0.1" && u.hostname === "localhost") u.hostname = "127.0.0.1";
    return u.toString();
  } catch {
    return url;
  }
}

/** Marketing iframe: ensure studio treats this as homepage showcase (hides profile/FPS, correct toolbar). */
function ensureShowcaseEmbedParams(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.get("showcase")) u.searchParams.set("showcase", "1");
    if (!u.searchParams.get("view")) u.searchParams.set("view", "1");
    if (!u.searchParams.get("mode")) u.searchParams.set("mode", "view");
    return u.toString();
  } catch {
    return url;
  }
}

function ShowcaseEdgeFades() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[max(3rem,5vw)] bg-gradient-to-b from-[#0E0E12] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[max(3rem,5vw)] bg-gradient-to-t from-[#0E0E12] to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[max(2rem,4vw)] bg-gradient-to-r from-[#0E0E12] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[max(2rem,4vw)] bg-gradient-to-l from-[#0E0E12] to-transparent" />
    </div>
  );
}

/** Taller viewport for the live embed (was ~520px max). */
const SHOWCASE_IFRAME_HEIGHT = "clamp(440px, 58vw, 640px)";

function ShowcaseStudioIframe({ src, title }: { src: string; title: string }) {
  const [effectiveSrc, setEffectiveSrc] = useState(src);

  useEffect(() => {
    setEffectiveSrc(ensureShowcaseEmbedParams(alignEmbedHostWithParent(src)));
  }, [src]);

  return (
    <iframe
      title={title}
      src={effectiveSrc}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-read; clipboard-write; fullscreen; microphone"
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

/**
 * Homepage canvas block:
 * 1) `NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL` — embeds live studio here (iframe). Use `/embed?...` link from Share → Homepage showcase.
 *    Disable iframe: `NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_IFRAME=false`.
 * 2) `NEXT_PUBLIC_WILDMIND_STUDIO_EMBED_URL` — iframe-only (legacy).
 * 3) Else local `InfiniteCanvas` demo.
 */
export default function StudioHomeShowcase() {
  if (SHOWCASE_URL) {
    return (
      <section className="bg-[#0E0E12] px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-3 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
              style={{ color: "#3B7FDB" }}
            >
              <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: "#3B7FDB" }} />
              Infinite Canvas
            </div>
            <h2
              className="text-[24px] leading-none tracking-[0.02em] text-white sm:text-[20px] md:text-[28px] lg:text-[36px]"
              style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
            >
              Build Visual Workflows
            </h2>
            <p className="mt-1.5 max-w-xl text-[11px] leading-snug text-white/40 sm:text-xs">
              Live canvas below — same URL as Share → Homepage showcase (<code className="text-white/50">/embed</code>{" "}
              + view-only).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={SHOWCASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/70 transition hover:border-white/25 hover:text-white sm:px-4 sm:py-2 sm:text-xs"
            >
              Open in new tab
            </a>
            <a
              href={studioOrigin(SHOWCASE_URL)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
            >
              Open Canvas
            </a>
          </div>
        </div>

        <div className="relative w-full bg-[#0E0E12]">
          {SHOWCASE_USE_IFRAME ? (
            <div className="overflow-x-auto overflow-y-hidden">
              <div
                className="relative w-full min-w-[768px]"
                style={{ height: SHOWCASE_IFRAME_HEIGHT, minHeight: SHOWCASE_IFRAME_HEIGHT }}
              >
                <ShowcaseStudioIframe src={SHOWCASE_URL} title="Wildmind Studio showcase" />
                <ShowcaseEdgeFades />
              </div>
            </div>
          ) : (
            <div
              className="flex min-h-[clamp(240px,36vw,320px)] flex-col items-center justify-center gap-3 px-6 py-10 text-center"
            >
              <p className="max-w-md text-[12px] leading-relaxed text-white/45 sm:text-sm">
                Iframe embed is turned off. Use the buttons above to open the showcase, or remove{" "}
                <code className="text-white/50">NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_IFRAME=false</code> from env to
                embed here again.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (LEGACY_EMBED_URL) {
    return (
      <section className="bg-[#0E0E12] px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-3 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
              style={{ color: "#3B7FDB" }}
            >
              <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: "#3B7FDB" }} />
              Infinite Canvas
            </div>
            <h2
              className="text-[24px] leading-none tracking-[0.02em] text-white sm:text-[20px] md:text-[28px] lg:text-[36px]"
              style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
            >
              Build Visual Workflows
            </h2>
            <p className="mt-1.5 max-w-xl text-[11px] leading-snug text-white/40 sm:text-xs">
              Live studio in an iframe (legacy env). Prefer{" "}
              <code className="text-white/55">NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL</code> if embedding fails.
            </p>
          </div>
          <a
            href={studioOrigin(LEGACY_EMBED_URL)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
          >
            Open Canvas
          </a>
        </div>

        <div className="relative w-full bg-[#0E0E12]">
          <div className="overflow-x-auto overflow-y-hidden">
            <div
              className="relative w-full min-w-[768px]"
              style={{ height: SHOWCASE_IFRAME_HEIGHT, minHeight: SHOWCASE_IFRAME_HEIGHT }}
            >
              <ShowcaseStudioIframe src={LEGACY_EMBED_URL} title="Wildmind Studio" />
              <ShowcaseEdgeFades />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <InfiniteCanvas />;
}
