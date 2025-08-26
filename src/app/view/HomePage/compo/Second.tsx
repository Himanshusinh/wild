'use client';
// components/HowToGuidesShared.tsx
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, MotionConfig } from "framer-motion";

type Slide = { id: string; src: string; title: string; subtitle?: string };

const SLIDES: Slide[] = [
  { id: "1", src: "/homepage/image 11.png", title: "Background Change", subtitle: "GENERATIVE AI SAAS SERVICE." },
  { id: "2", src: "/homepage/image.png", title: "Portrait Upscale", subtitle: "GENERATIVE AI SAAS SERVICE." },
  { id: "3", src: "/homepage/image3.png", title: "Product Shadow", subtitle: "GENERATIVE AI SAAS SERVICE." },
  { id: "4", src: "/homepage/image2.png", title: "Sky Replacement", subtitle: "GENERATIVE AI SAAS SERVICE." },
];

export default function HowToGuidesShared() {
  const [active, setActive] = useState(0);
  const total = SLIDES.length;
  const main = SLIDES[active];
  const nextIndex = useMemo(() => (active + 1) % total, [active, total]);
  const nextSlide = SLIDES[nextIndex];
  const thirdIndex = useMemo(() => (active + 2) % total, [active, total]);
  const thirdSlide = SLIDES[thirdIndex];

  const go = (idx: number) => {
    if (idx === active) return;
    setActive((idx + total) % total);
  };
  const next = () => go((active + 1) % total);
  const prev = () => go((active - 1 + total) % total);

  return (
    <MotionConfig transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="w-full px-4 md:px-8 lg:px-12 py-8">
        <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6">
          How To Use & Guides
        </h2>

        <div className="flex items-stretch gap-6">
          {/* LEFT: HERO SLOT (the active slide grows into here) */}
          <div className="relative flex-1 min-w-0">
            <div className="relative h-[320px] md:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/30">
              <motion.div
                key={main.id}
                layoutId={`card-${main.id}`} // shared element id
                className="absolute inset-0 rounded-3xl overflow-hidden"
              >
                {/* media */}
                <div className="absolute inset-0">
                  <Image src={main.src} alt={main.title} fill className="object-cover" priority />
                </div>
                {/* gradient + text */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/80" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="text-white/70 text-[10px] md:text-xs tracking-[.2em] mb-2">
                    {main.subtitle}
                  </div>
                  <div className="text-white text-2xl md:text-4xl font-semibold mb-4">
                    {main.title}
                  </div>
                  <button className="bg-[#1677FF] hover:bg-[#1b6dff] text-white rounded-xl px-5 py-3 text-sm font-semibold">
                    Get Started!
                  </button>
                </div>
              </motion.div>

              {/* controls */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-10 flex items-center gap-6">
                <button
                  onClick={prev}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white grid place-items-center transition"
                  aria-label="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="text-white/80 text-lg tabular-nums">
                  {active + 1} <span className="opacity-60">/ {total}</span>
                </div>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white grid place-items-center transition"
                  aria-label="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: NEXT THUMB + 10% PEEK OF THIRD */}
          <div className="hidden md:flex w-[360px] items-center justify-between gap-3">
            {/* Large next thumbnail (centered vertically by parent alignment) */}
            <motion.button
              key={nextSlide.id}
              layoutId={`card-${nextSlide.id}`}
              onClick={() => go(nextIndex)}
              className="relative w-[300px] h-[140px] rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/20 focus:outline-none"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
              aria-label="Open next slide"
            >
              <Image src={nextSlide.src} alt={nextSlide.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute -inset-y-4 left-1/3 w-16 rotate-12 bg-white/20" />
            </motion.button>

            {/* 10% visible sliver for the third image */}
            <motion.button
              key={thirdSlide.id}
              layoutId={`card-${thirdSlide.id}`}
              onClick={() => go(thirdIndex)}
              className="relative h-[140px] w-[10%] min-w-[22px] max-w-[36px] rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/20 focus:outline-none"
              aria-label="Peek third slide"
            >
              <Image src={thirdSlide.src} alt={thirdSlide.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </motion.button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
