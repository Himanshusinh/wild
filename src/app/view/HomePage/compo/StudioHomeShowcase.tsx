"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL } from "@/config/homeShowcaseDefaults";
import InfiniteCanvas from "./InfiniteCanvas";

/**
 * True when the page is served from a real domain (e.g. Vercel / wildmindai.com) but the env
 * still points the iframe at localhost — that never works for visitors and is the usual reason
 * “production doesn’t show my local canvas.”
 */
function useShowcaseLocalhostOnProduction(showcaseSrc: string): boolean {
  const [mismatch, setMismatch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !showcaseSrc) {
      setMismatch(false);
      return;
    }
    try {
      const u = new URL(showcaseSrc);
      const h = window.location.hostname;
      const pageIsLocalDev = h === "localhost" || h === "127.0.0.1";
      const embedPointsAtLocalMachine =
        u.hostname === "localhost" || u.hostname === "127.0.0.1";
      setMismatch(!pageIsLocalDev && embedPointsAtLocalMachine);
    } catch {
      setMismatch(false);
    }
  }, [showcaseSrc]);
  return mismatch;
}

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

/** Build-time public showcase URL, or built-in default so the homepage always embeds the public project. */
const SHOWCASE_URL_RAW = process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL?.trim() ?? "";

/** Effective initial showcase (never empty unless we deliberately skip to InfiniteCanvas). */
const INITIAL_SHOWCASE_FROM_ENV = SHOWCASE_URL_RAW
  ? normalizeStudioEmbedUrl(SHOWCASE_URL_RAW)
  : normalizeStudioEmbedUrl(DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL);

/** Legacy: iframe-only embed URL. */
const LEGACY_EMBED_RAW = process.env.NEXT_PUBLIC_WILDMIND_STUDIO_EMBED_URL?.trim() ?? "";

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
 * 1) `WILDMIND_CANVAS_SHOWCASE_URL` (server) or `NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL` (build-time) — live iframe.
 * 2) If unset, built-in public embed (`DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL`) so all visitors see the same showcase without env.
 * 3) `WILDMIND_STUDIO_EMBED_URL` — legacy.
 * 4) Else `InfiniteCanvas` offline demo.
 *
 * Server env is merged via `GET /api/home/showcase-url` when set.
 */
export default function StudioHomeShowcase() {
  const [resolved, setResolved] = useState(() => ({
    showcase: INITIAL_SHOWCASE_FROM_ENV,
    legacy: LEGACY_EMBED_RAW ? normalizeStudioEmbedUrl(LEGACY_EMBED_RAW) : "",
    useIframe: SHOWCASE_USE_IFRAME,
  }));
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/showcase-url", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          showcaseUrl?: string;
          legacyEmbedUrl?: string;
          useIframe?: boolean;
        };
        if (cancelled) return;
        const s = (data.showcaseUrl ?? "").trim();
        const l = (data.legacyEmbedUrl ?? "").trim();
        setResolved({
          showcase: s
            ? normalizeStudioEmbedUrl(s)
            : normalizeStudioEmbedUrl(DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL),
          legacy: l ? normalizeStudioEmbedUrl(l) : "",
          useIframe: data.useIframe !== false,
        });
      } catch {
        /* keep build-time NEXT_PUBLIC values */
      } finally {
        if (!cancelled) setConfigReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const embedUrlForMismatchCheck = (resolved.showcase || resolved.legacy || "").trim();
  const showcasePointsAtLocalhostOnProd =
    useShowcaseLocalhostOnProduction(embedUrlForMismatchCheck);

  if (!configReady && !resolved.showcase && !resolved.legacy) {
    return (
      <section className="bg-[#0E0E12] px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-3 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="h-20 max-w-md animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-9 w-32 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        <div
          className="min-h-[clamp(440px,58vw,640px)] w-full animate-pulse rounded-2xl bg-white/[0.04]"
          aria-busy="true"
          aria-label="Loading studio showcase"
        />
      </section>
    );
  }

  if (resolved.showcase) {
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
              href={resolved.showcase}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/70 transition hover:border-white/25 hover:text-white sm:px-4 sm:py-2 sm:text-xs"
            >
              Open in new tab
            </a>
            <a
              href={studioOrigin(resolved.showcase)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
            >
              Open Canvas
            </a>
          </div>
        </div>

        <div className="relative w-full bg-[#0E0E12]">
          {showcasePointsAtLocalhostOnProd ? (
            <div
              className="flex min-h-[clamp(440px,58vw,640px)] flex-col items-center justify-center gap-3 px-6 py-10 text-center"
              role="status"
            >
              <p className="max-w-lg text-[12px] leading-relaxed text-amber-200/90 sm:text-sm">
                This deploy still embeds <code className="text-white/80">localhost</code> — only you can load that URL.
                In your host&apos;s env (e.g. Vercel → Environment Variables), set{" "}
                <code className="text-white/70">NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL</code> to your{" "}
                <strong className="font-medium text-white">HTTPS</strong> studio link, for example{" "}
                <code className="break-all text-white/60">
                  https://studio.wildmindai.com/embed?projectId=…&amp;view=1&amp;mode=view&amp;showcase=1
                </code>
                . Then redeploy. The <code className="text-white/70">projectId</code> must be a project that exists on{" "}
                <strong className="font-medium text-white">production</strong> studio (open studio on the web, use Share
                → Homepage showcase to copy the link).
              </p>
            </div>
          ) : resolved.useIframe ? (
            <div className="overflow-x-auto overflow-y-hidden">
              <div
                className="relative w-full min-w-[768px]"
                style={{ height: SHOWCASE_IFRAME_HEIGHT, minHeight: SHOWCASE_IFRAME_HEIGHT }}
              >
                <ShowcaseStudioIframe src={resolved.showcase} title="Wildmind Studio showcase" />
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

  if (resolved.legacy) {
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
            href={studioOrigin(resolved.legacy)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
          >
            Open Canvas
          </a>
        </div>

        <div className="relative w-full bg-[#0E0E12]">
          {showcasePointsAtLocalhostOnProd ? (
            <div
              className="flex min-h-[clamp(440px,58vw,640px)] flex-col items-center justify-center gap-3 px-6 py-10 text-center"
              role="status"
            >
              <p className="max-w-lg text-[12px] leading-relaxed text-amber-200/90 sm:text-sm">
                This deploy still embeds <code className="text-white/80">localhost</code> — only you can load that URL.
                Set <code className="text-white/70">NEXT_PUBLIC_WILDMIND_STUDIO_EMBED_URL</code> (or prefer{" "}
                <code className="text-white/70">NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL</code>) to an{" "}
                <strong className="font-medium text-white">HTTPS</strong> production studio embed URL and redeploy.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden">
              <div
                className="relative w-full min-w-[768px]"
                style={{ height: SHOWCASE_IFRAME_HEIGHT, minHeight: SHOWCASE_IFRAME_HEIGHT }}
              >
                <ShowcaseStudioIframe src={resolved.legacy} title="Wildmind Studio" />
                <ShowcaseEdgeFades />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return <InfiniteCanvas />;
}
