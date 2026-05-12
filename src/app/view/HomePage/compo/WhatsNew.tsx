"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Sparkles, Wand2 } from "lucide-react";

type NewItem = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  features?: string[];
  href: string;
  color: string; // primary accent hex
  Icon: typeof Sparkles;
  media: {
    kind: "image" | "video";
    src: string;
    alt: string;
    position?: string;
  };
};

const NEW_ITEMS: NewItem[] = [
  {
    id: "new-model",
    eyebrow: "New Model",
    title: "Seedance 2.0",
    desc: "Fast video generation for both text-to-video and image-to-video creation inside WildMind.",
    features: ["Auto / 4-15s", "480p / 720p", "T2V + I2V", "Audio On/Off"],
    href: "/text-to-video?model=seedance-2.0-t2v",
    color: "#8B5CF6",
    Icon: Bot,
    media: {
      kind: "video",
      src: "https://idr01.zata.ai/devstoragev1/public/core/cyberpunk.gif",
      alt: "Neon city motion preview for Seedance 2.0",
      position: "center",
    },
  },
  {
    id: "new-model-veo-lite",
    eyebrow: "New Model",
    title: "Veo 3.1 Lite",
    desc: "Lower-cost cinematic video model for faster text-to-video and image-to-video generation.",
    features: ["4 / 6 / 8s", "720p / 1080p", "T2V + I2V", "16:9 / 9:16"],
    href: "/text-to-video?model=veo3.1-lite-t2v-8s",
    color: "#F97316",
    Icon: Wand2,
    media: {
      kind: "video",
      src: "https://idr01.zata.ai/devstoragev1/public/homepage/whatsnew/veo-3.1-lite.mp4",
      alt: "Cinematic motion video for Veo 3.1 Lite",
      position: "center",
    },
  },
  {
    id: "new-model-kling-pro",
    eyebrow: "New Model",
    title: "Kling 3.0 Pro",
    desc: "High-control video model for polished motion, better prompt follow-through, and audio-ready generation.",
    features: ["5-15s", "16:9 / 9:16 / 1:1", "T2V + I2V", "Audio On/Off"],
    href: "/text-to-video?model=kling-v3-pro",
    color: "#22C55E",
    Icon: Bot,
    media: {
      kind: "video",
      src: "https://idr01.zata.ai/devstoragev1/public/homepage/whatsnew/kling-run.mp4",
      alt: "Dynamic motion video for Kling 3.0 Pro",
      position: "center",
    },
  },
  {
    id: "new-model-pixverse-v6",
    eyebrow: "New Model",
    title: "PixVerse V6",
    desc: "Multishot cinematic video with optional synced audio, style presets, and strong text- or image-to-video control.",
    features: ["5–15s", "360p / 1080p", "T2V + I2V", "Audio + Multishot"],
    href: "/text-to-video?model=pixverse-v6-t2v",
    color: "#E879F9",
    Icon: Bot,
    media: {
      kind: "video",
      src: "https://idr01.zata.ai/devstoragev1/public/homepage/whatsnew/pixverse.mp4",
      alt: "Atmospheric motion preview for PixVerse V6",
      position: "50% 35%",
    },
  },
  {
    id: "new-model-nano-banana-2",
    eyebrow: "New Model",
    title: "Nano Banana 2",
    desc: "Next-gen image generation with cleaner detail, stronger consistency, and flexible text-to-image creation.",
    features: ["1K / 2K / 4K", "14 Ratios", "Text to Image", "High Consistency"],
    href: "/text-to-image?model=google/nano-banana-2",
    color: "#38BDF8",
    Icon: Sparkles,
    media: {
      kind: "image",
      src: "https://idr01.zata.ai/devstoragev1/public/styles/creative.avif",
      alt: "Creative image backdrop for Nano Banana 2",
      position: "center",
    },
  },
  {
    id: "new-model-qwen-image-2-pro",
    eyebrow: "New Model",
    title: "Qwen Image 2 Pro",
    desc: "Premium image generation with high-fidelity results, stronger prompt alignment, and polished compositions.",
    features: ["1K / 2K", "9 Ratios", "High Fidelity", "Prompt Align"],
    href: "/text-to-image?model=qwen/qwen-image-2-pro",
    color: "#EC4899",
    Icon: Sparkles,
    media: {
      kind: "image",
      src: "https://idr01.zata.ai/devstoragev1/public/styles/pro-color-photography.avif",
      alt: "High-fidelity photography background for Qwen Image 2 Pro",
      position: "center",
    },
  },
];

export default function WhatsNew() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const arrowThreshold = 12;

  const scrollRight = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(280, el.clientWidth * 0.82), behavior: "smooth" });
  };

  const scrollLeft = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: -Math.max(280, el.clientWidth * 0.82), behavior: "smooth" });
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let rafId: number | null = null;

    const updateArrows = () => {
      const firstCard = el.firstElementChild as HTMLElement | null;
      const lastCard = el.lastElementChild as HTMLElement | null;
      const railRect = el.getBoundingClientRect();

      const hasHiddenContentOnLeft = firstCard
        ? firstCard.getBoundingClientRect().left < railRect.left - arrowThreshold
        : Math.max(0, el.scrollLeft) > arrowThreshold;

      const hasHiddenContentOnRight = lastCard
        ? lastCard.getBoundingClientRect().right > railRect.right + arrowThreshold
        : Math.max(0, el.scrollWidth - el.clientWidth - el.scrollLeft) >
          arrowThreshold;

      setShowLeftArrow(hasHiddenContentOnLeft);
      setShowRightArrow(hasHiddenContentOnRight);
    };

    const scheduleUpdateArrows = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateArrows();
      });
    };

    el.scrollTo({ left: 0, behavior: "auto" });
    const frameId = window.requestAnimationFrame(updateArrows);
    el.addEventListener("scroll", scheduleUpdateArrows, { passive: true });
    window.addEventListener("resize", scheduleUpdateArrows);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (rafId != null) window.cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", scheduleUpdateArrows);
      window.removeEventListener("resize", scheduleUpdateArrows);
    };
  }, [arrowThreshold]);

  return (
    <section className="bg-[#0E0E12] px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-4 bg-[#3B82F6]" />
            Updates
          </p>
          <h2
            className="text-[30px] uppercase leading-none tracking-[0.03em] text-white sm:text-[38px]"
            style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
          >
            What&apos;s New
          </h2>
        </div>

        <Link
          href="/text-to-image"
          className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:border-[#3B82F6]/40 hover:text-[#3B82F6] md:inline-flex"
        >
          <span>Explore now</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-6 lg:px-16"
        >
          {NEW_ITEMS.map((item) => {
            const isRealVideo =
              item.media.kind === "video" &&
              /\.(mp4|webm|mov)$/i.test(item.media.src);

            return (
              <Link
                key={item.id}
                href={item.href}
                style={
                  {
                    "--accent": item.color,
                  } as React.CSSProperties
                }
                className="group relative flex aspect-[3/4] w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#17171F] to-[#101016] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[color:var(--accent)]/40 hover:shadow-[0_20px_60px_-20px_var(--accent)] sm:w-[330px] sm:p-6"
              >
                {isRealVideo ? (
                  <video
                    src={item.media.src}
                    aria-label={item.media.alt}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                    style={{ objectPosition: item.media.position || "center" }}
                  />
                ) : (
                  <img
                    src={item.media.src}
                    alt={item.media.alt}
                    loading="lazy"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                    style={{ objectPosition: item.media.position || "center" }}
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-[#07080D]/30" />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(7,8,13,0.04) 0%, rgba(7,8,13,0.1) 26%, rgba(7,8,13,0.28) 46%, rgba(7,8,13,0.76) 74%, rgba(7,8,13,0.96) 100%), linear-gradient(135deg, ${item.color}22 0%, transparent 38%, rgba(7,8,13,0.74) 100%)`,
                  }}
                />

                {/* Top-right accent glow */}
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
                  style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
                />

                {/* Top accent line */}
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${item.color} 50%, transparent 100%)`,
                  }}
                />

                <div className="relative z-10 flex h-full flex-1 flex-col">
                  {item.media.kind === "video" && (
                    <div className="flex justify-end">
                      {/* <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.32)] backdrop-blur-md">
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M4.2 3.2L8.4 6 4.2 8.8V3.2Z" fill="currentColor" />
                        </svg>
                      </div> */}
                    </div>
                  )}

                  <div className="mt-auto flex flex-1 flex-col justify-end px-1 pb-1 pt-28 sm:pt-32">
                    <h3
                      className="mt-4 max-w-[230px] text-[26px] uppercase leading-[0.95] tracking-[0.02em] text-white sm:text-[30px]"
                      style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }} 
                    >
                      {item.title}
                    </h3>

                    <div className="mt-2.5 flex items-center gap-2">
                      <div
                        className="h-[2px] w-8 rounded-full transition-all duration-500 group-hover:w-14"
                        style={{ background: item.color }}
                      />
                      <div className="h-[2px] flex-1 rounded-full bg-white/5" />
                    </div>

                    <p className="mt-3 max-w-[270px] text-[12px] leading-[1.6] text-white/72">
                      {item.desc}
                    </p>

                    {item.features && item.features.length > 0 && (
                      <div className="mt-3.5 flex max-w-[280px] flex-wrap gap-1.5">
                        {item.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white/78"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {showLeftArrow && (
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll what's new left"
            className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 md:flex lg:left-2"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 2.5L4.5 6L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {showRightArrow && (
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll what's new right"
            className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 md:flex lg:right-2"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
