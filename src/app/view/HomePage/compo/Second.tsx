'use client';
// components/HowToGuidesShared.tsx
import React, { useMemo, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { getImageUrl } from '../routes';

type Slide = { id: string; src: string; title: string; subtitle?: string; isVideo?: boolean };

const SLIDES: Slide[] = [
  { id: "1", src: getImageUrl('howToUse', 'brandLaunch'), title: "Brand Boosting", subtitle: "Create your first AI-Powered Marketing Campaign", isVideo: true },
  { id: "2", src: getImageUrl('howToUse', 'mountainLandscape'), title: "Upscale your Image and Video", subtitle: "Bring life to your images and videos by enhancing their resolution and clarity.", isVideo: true },
  { id: "3", src: getImageUrl('howToUse', 'realTimeCanvas'), title: "Real Time Canvas", subtitle: "Bring your desired changes in images, live time!", isVideo: true },
  { id: "4", src: getImageUrl('howToUse', 'sceneSetup'), title: "Social Media Assistance", subtitle: "Expand your content compatible to social media aspect.", isVideo: true },
  { id: "5", src: getImageUrl('howToUse', 'showcaseDemo'), title: "Showcase Designs in Mockups", subtitle: "Display your design and work with context.", isVideo: true },
];

export default function HowToGuidesShared() {
  const [active, setActive] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const total = SLIDES.length;
  const main = SLIDES[active];
  const nextIndex = useMemo(() => (active + 1) % total, [active, total]);
  const nextSlide = SLIDES[nextIndex];
  const thirdIndex = useMemo(() => (active + 2) % total, [active, total]);
  const thirdSlide = SLIDES[thirdIndex];

  const go = (idx: number) => {
    if (idx === active) return;
    setIsLoading(true);
    setActive((idx + total) % total);
    // Reset loading after video starts
    setTimeout(() => setIsLoading(false), 500);
  };
  const next = () => go((active + 1) % total);
  const prev = () => go((active - 1 + total) % total);

  return (
    <MotionConfig transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="w-full px-4 md:px-8 lg:px-12 py-8 mt-10">
        <h2 className="text-white text-2xl md:text-4xl font-medium mb-6 ml-0">
          How To Use & Guides
        </h2>

        <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-6">
          {/* LEFT: HERO SLOT (the active slide grows into here) */}
          <div className="relative flex-1 min-w-0">
            {/* Hidden preloader for next video */}
            <video 
              src={nextSlide.src} 
              preload="auto" 
              muted 
              className="hidden"
            />
            <div className="relative h-[280px] md:h-[420px] lg:h-[480px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/30">
              <motion.div
                key={main.id}
                layoutId={`card-${main.id}`} // shared element id
                className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden"
              >
                {/* media */}
                <div className="absolute inset-0">
                  <video 
                    src={main.src} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    preload="auto"
                    key={main.id}
                    onLoadStart={() => setIsLoading(false)}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm md:text-lg">Loading...</div>
                    </div>
                  )}
                </div>
                {/* gradient + text */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/85" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <div className="text-white/80 text-[10px] md:text-xs tracking-[.1em] mb-2 font-medium">
                    {main.subtitle}
                  </div>
                  <div className="text-white !text-2xl md:!text-5xl font-semibold mb-3 md:mb-4 leading-tight">
                    {main.title}
                  </div>
                  <button className="bg-[#1C303D] hover:bg-[#1b6dff] text-white rounded-full px-5 md:px-5 py-2.5 md:py-3 text-sm md:text-sm font-semibold transition-all duration-200 hover:scale-105">
                    Explore
                  </button>
                </div>
              </motion.div>

              {/* controls */}
              <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 z-10 flex items-center gap-2 md:gap-6">
                <button
                  onClick={prev}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-black grid place-items-center transition-all duration-200 hover:scale-110 shadow-lg"
                  aria-label="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="text-white/90 text-sm md:text-lg tabular-nums font-medium bg-black/30 px-2 py-1 rounded-full">
                  {active + 1} <span className="opacity-70">/ {total}</span>
                </div>
                <button
                  onClick={next}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-black grid place-items-center transition-all duration-200 hover:scale-110 shadow-lg"
                  aria-label="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: NEXT THUMB + THIRD THUMB - EQUALLY DIVIDED */}
          <div className="flex w-full md:w-[360px] items-stretch gap-3 md:gap-3">
            {/* Second thumbnail - 50% width */}
            <motion.button
              key={nextSlide.id}
              layoutId={`card-${nextSlide.id}`}
              onClick={() => go(nextIndex)}
              className="relative flex-1 h-[110px] md:h-[140px] rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-white/20 hover:ring-white/40 focus:outline-none transition-all duration-200 hover:scale-105"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
              aria-label="Open next slide"
            >
              <video 
                src={nextSlide.src} 
                className="w-full h-full object-cover" 
                muted 
                playsInline
                preload="metadata"
                key={nextSlide.id}
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center text-white text-center px-2">
                  <span className="text-xs md:text-sm font-semibold">{nextSlide.title}</span>
                  <span className="text-base md:text-xl font-bold ml-1 mt-0.5">&gt;</span>
                </div>
              </div>
            </motion.button>

            {/* Third thumbnail - 50% width */}
            <motion.button
              key={thirdSlide.id}
              layoutId={`card-${thirdSlide.id}`}
              onClick={() => go(thirdIndex)}
              className="relative flex-1 h-[110px] md:h-[140px] rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-white/20 hover:ring-white/40 focus:outline-none transition-all duration-200 hover:scale-105"
              aria-label="Open third slide"
            >
              <video 
                src={thirdSlide.src} 
                className="w-full h-full object-cover" 
                muted 
                playsInline
                preload="metadata"
                key={thirdSlide.id}
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center text-white text-center px-2">
                  <span className="text-xs md:text-sm font-semibold">{thirdSlide.title}</span>
                  <span className="text-base md:text-xl font-bold ml-1 mt-0.5">&gt;</span>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
