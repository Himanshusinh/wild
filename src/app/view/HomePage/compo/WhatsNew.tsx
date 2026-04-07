"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  ImagePlus,
  Layers3,
  Sparkles,
  Wand2,
} from "lucide-react";

type NewItem = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
  accent: string;
  Icon: typeof Sparkles;
};

const NEW_ITEMS: NewItem[] = [
  {
    id: "new-feature",
    eyebrow: "New Feature",
    title: "Prompt Enhance",
    desc: "Refine rough ideas into clearer image prompts with faster creative guidance.",
    href: "/text-to-image",
    accent: "from-[#3B82F6]/25 via-[#60A5FA]/12 to-transparent",
    Icon: Sparkles,
  },
  {
    id: "new-model",
    eyebrow: "New Model",
    title: "GPT Image 1.5",
    desc: "Sharper instruction-following for polished image generations and edits.",
    href: "/text-to-image?model=openai/gpt-image-1.5",
    accent: "from-[#8B5CF6]/25 via-[#C084FC]/10 to-transparent",
    Icon: Bot,
  },
  {
    id: "new-app",
    eyebrow: "New App",
    title: "Edit Image",
    desc: "Jump into quick edits, cleanup, and visual changes without leaving the studio flow.",
    href: "/text-to-image/edit-image",
    accent: "from-[#10B981]/25 via-[#34D399]/10 to-transparent",
    Icon: ImagePlus,
  },
  {
    id: "new-video",
    eyebrow: "New Video",
    title: "Veo 3.1",
    desc: "Create more cinematic motion with an upgraded text-to-video generation experience.",
    href: "/text-to-video?model=veo3.1-t2v-8s",
    accent: "from-[#F97316]/25 via-[#FB923C]/10 to-transparent",
    Icon: Wand2,
  },
  {
    id: "new-workflow",
    eyebrow: "New Workflow",
    title: "Remove Background",
    desc: "Cleanly isolate products, portraits, and assets in one tap for faster content production.",
    href: "/view/workflows/general/remove-background",
    accent: "from-[#EC4899]/25 via-[#F472B6]/10 to-transparent",
    Icon: Layers3,
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
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-6 lg:px-16"
        >
          {NEW_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative min-h-[220px] w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#14141A] p-4 transition-all duration-300 hover:border-white/20 hover:bg-[#181821] sm:min-h-[240px] sm:w-[320px] sm:p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-100`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_34%)] opacity-60" />

              <div className="relative flex h-full flex-col">
                <div className="mb-10 flex items-start justify-between">
                  <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 backdrop-blur-md">
                    {item.eyebrow}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-white/85 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                    <item.Icon size={19} strokeWidth={1.9} />
                  </div>
                </div>

                <div className="mt-auto">
                  <h3
                    className="max-w-[210px] text-[28px] uppercase leading-none tracking-[0.04em] text-white sm:text-[32px]"
                    style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[250px] text-[12px] leading-[1.55] text-white/55 sm:max-w-[270px] sm:text-[12.5px]">
                    {item.desc}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/72 transition-colors group-hover:text-white">
                    <span>Open</span>
                    <ArrowUpRight size={13} />
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
