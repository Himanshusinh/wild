"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Sparkles,
  Wand2,
} from "lucide-react";

type NewItem = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  features?: string[];
  href: string;
  color: string; // primary accent hex
  Icon: typeof Sparkles;
};

const NEW_ITEMS: NewItem[] = [
  {
    id: "new-model",
    eyebrow: "New Model",
    title: "Seedance 2.0",
    desc: "New FAL video model for both text-to-video and image-to-video generation inside WildMind.",
    features: ["Auto / 4-15s", "480p / 720p", "T2V + I2V", "Audio On/Off"],
    href: "/text-to-video?model=seedance-2.0-t2v",
    color: "#8B5CF6",
    Icon: Bot,
  },
  {
    id: "new-model-veo-lite",
    eyebrow: "New Model",
    title: "Veo 3.1 Lite",
    desc: "Lower-cost Veo model for faster cinematic text-to-video and image-to-video generation.",
    features: ["4 / 6 / 8s", "720p / 1080p", "T2V + I2V", "16:9 / 9:16"],
    href: "/text-to-video?model=veo3.1-lite-t2v-8s",
    color: "#F97316",
    Icon: Wand2,
  },
  {
    id: "new-model-kling-pro",
    eyebrow: "New Model",
    title: "Kling 3.0 Pro",
    desc: "High-control Kling model for polished motion, better prompt follow-through, and audio-ready video generation.",
    features: ["5-15s", "16:9 / 9:16 / 1:1", "T2V + I2V", "Audio On/Off"],
    href: "/text-to-video?model=kling-v3-pro",
    color: "#22C55E",
    Icon: Bot,
  },
];

export default function WhatsNew() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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

    const updateArrows = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft < maxScroll - 2);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

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
          {NEW_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={
                {
                  "--accent": item.color,
                } as React.CSSProperties
              }
              className="group relative flex min-h-[280px] w-[290px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#17171F] to-[#101016] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[color:var(--accent)]/40 hover:shadow-[0_20px_60px_-20px_var(--accent)] sm:min-h-[300px] sm:w-[330px] sm:p-6"
            >
              {/* Top-right accent glow */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
                style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
              />

              {/* Subtle grid texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              {/* Top accent line */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${item.color} 50%, transparent 100%)`,
                }}
              />

              {/* Header row */}
              <div className="relative flex items-start justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 8px ${item.color}`,
                    }}
                  />
                  {item.eyebrow}
                </span>

                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-[color:var(--accent)]/50"
                  style={{
                    boxShadow: `inset 0 0 20px -5px ${item.color}30`,
                  }}
                >
                  <item.Icon size={18} strokeWidth={1.8} style={{ color: item.color }} />
                </div>
              </div>

              {/* Title block pushed to bottom */}
              <div className="relative mt-auto pt-8">
                <h3
                  className="max-w-[230px] text-[26px] uppercase leading-[0.95] tracking-[0.02em] text-white sm:text-[30px]"
                  style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
                >
                  {item.title}
                </h3>

                {/* Accent underline */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className="h-[2px] w-8 rounded-full transition-all duration-500 group-hover:w-14"
                    style={{ background: item.color }}
                  />
                  <div className="h-[2px] flex-1 rounded-full bg-white/5" />
                </div>

                <p className="mt-3 max-w-[270px] text-[12px] leading-[1.6] text-white/55">
                  {item.desc}
                </p>

                {item.features && item.features.length > 0 && (
                  <div className="mt-3.5 flex max-w-[280px] flex-wrap gap-1.5">
                    {item.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white/70"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA row */}
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/60 transition-colors duration-300 group-hover:text-white">
                    Open
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-all duration-300 group-hover:border-[color:var(--accent)]/60 group-hover:bg-[color:var(--accent)]/15 group-hover:text-white"
                  >
                    <ArrowUpRight size={13} strokeWidth={2} className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollLeft}
          disabled={!showLeftArrow}
          aria-label="Scroll what's new left"
          className={`absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:flex lg:left-10 ${showLeftArrow ? "opacity-100" : "opacity-35"}`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2.5L4.5 6L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={scrollRight}
          disabled={!showRightArrow}
          aria-label="Scroll what's new right"
          className={`absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:flex lg:right-10 ${showRightArrow ? "opacity-100" : "opacity-35"}`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
