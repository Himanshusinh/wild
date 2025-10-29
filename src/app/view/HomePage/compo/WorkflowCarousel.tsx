'use client';

// components/WorkflowCarousel.tsx
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface WorkflowCard {
  id: string;
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  description: string;
  ctaText?: string;
  image: string; // /public path or remote URL (configure next.config if remote)
}

interface Props {
  items: WorkflowCard[];
  autoPlay?: boolean;
  intervalMs?: number; // autoplay interval
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

export default function WorkflowCarousel({
  items,
  autoPlay = false,
  intervalMs = 4500,
  className = "",
}: Props) {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const deltaX = useRef(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // autoplay
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [autoPlay, intervalMs, items.length]);

  const go = (i: number) => setIndex(((i % items.length) + items.length) % items.length);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // drag (mouse/touch) – optional but nice
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    deltaX.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    deltaX.current = e.clientX - startX.current;
    const percent = (-index * 100) + (deltaX.current / trackRef.current.clientWidth) * 100;
    trackRef.current.style.transform = `translate3d(${percent}%,0,0)`;
  };
  const onPointerUp = () => {
    if (!trackRef.current) return;
    setIsDragging(false);
    // snap
    const threshold = 60; // px
    if (deltaX.current > threshold) prev();
    else if (deltaX.current < -threshold) next();
    // reset transform (CSS transition handles snap)
    trackRef.current.style.transform = `translate3d(${-index * 100}%,0,0)`;
  };

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Outer frame */}
      <div className="relative overflow-hidden backdrop-blur-md pb-12 md:pb-16">
        {/* Slider track */}
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(${-index * 100}%,0,0)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {items.map((item) => (
            <section key={item.id} className="min-w-full pt-2 px-3 md:pl-0 md:pr-12 md:pt-6 md:pb-12 lg:pl-0 lg:pr-12 lg:pt-6 lg:pb-12">
              <article className="relative rounded-2xl md:rounded-3xl ring-white/10 bg-white/5 px-3 md:pl-8 py-6 md:py-24 md:min-h-[520px] lg:min-h-[520px] flex flex-col md:flex-row gap-4 md:gap-8 items-stretch">
                {/* Left: text */}
                <div className="flex-1 md:max-w-[calc(100%-650px)] lg:max-w-[calc(100%-720px)] -mt-2 md:-mt-8 lg:-mt-16">
                  <h3 className="text-white text-2xl md:text-[35px] font-medium mb-4 md:mb-6 mt-2 md:mt-4">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <div className={item.subtitleClassName ?? "text-white/70 text-2xl md:text-6xl"}>
                      {item.subtitle}
                    </div>
                  )}
                  <p className="text-white leading-relaxed mb-3 md:mb-4 max-w-full mt-2 md:mt-4 text-sm md:text-lg text-justify">
                    {item.description}
                  </p>
                </div>

                {/* Right: image */}
                <div className="relative md:absolute md:right-8 lg:right-8 md:top-0 md:bottom-0 md:w-[600px] lg:w-[700px] h-[180px] md:h-auto flex-shrink-0">
                  <div className="absolute inset-x-0 top-1 bottom-1 md:top-4 md:bottom-4 lg:top-6 lg:bottom-6 rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/20">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  
                  {/* Button positioned at bottom right of image */}
                  {item.ctaText && (
                    <button className="absolute bottom-6 right-3 md:bottom-10 md:right-4 inline-flex items-center gap-1 md:gap-2 bg-[#1C303D] text-white font-semibold rounded-full px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm shadow/50 hover:shadow transition z-10">
                      {item.ctaText}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </article>
            </section>
          ))}
        </div>

        {/* Right-edge mask to hide peeking outline of next card */}
        <div className="pointer-events-none absolute  top-0 right-0 bottom-0 w-2 md:w-3 bg-white/5" />
 
        {/* Arrows */}
        <div className="absolute bottom-12 right-4 md:bottom-14 md:right-16 z-10 flex items-center justify-end gap-3 md:gap-6">
          <button
            onClick={prev}
            aria-label="Previous"
            className="w-7 h-7 md:w-8 md:h-8 grid place-items-center rounded-full bg-white/95 hover:bg-white text-black transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
 
          <button
            onClick={next}
            aria-label="Next"
            className="w-7 h-7 md:w-8 md:h-8 grid place-items-center rounded-full bg-white/95 hover:bg-white text-black transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Dots - mirrored on the left side with similar spacing */}
        <div className="absolute bottom-14 left-3 md:bottom-20 md:left-8 z-10 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={`w-2 h-2 md:w-1.5 md:h-1.5 rounded-full transition-all duration-200 ${
                i === index ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60 hover:scale-110"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
