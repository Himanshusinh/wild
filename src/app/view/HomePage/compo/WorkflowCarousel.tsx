'use client';

// components/WorkflowCarousel.tsx
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface WorkflowCard {
  id: string;
  title: string;
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
      <div className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10 bg-[#121218]/60 backdrop-blur-md">
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
            <section key={item.id} className="min-w-full p-6 md:p-8 lg:p-10">
              <article className="rounded-3xl ring-1 ring-white/10 bg-[#1A1A22]/70 px-6 md:px-8 py-8 md:py-10 flex flex-col lg:flex-row gap-8 items-stretch">
                {/* Left: text */}
                <div className="flex-1">
                  <h3 className="text-white text-2xl md:text-3xl font-semibold mb-4">
                    {item.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed mb-6 max-w-[620px]">
                    {item.description}
                  </p>
                  {item.ctaText && (
                    <button className="inline-flex items-center gap-2 bg-white text-[#0D0F14] font-semibold rounded-full px-5 py-2 shadow/50 hover:shadow transition">
                      {item.ctaText}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Right: image */}
                <div className="relative lg:w-[520px] h-[220px] md:h-[300px] lg:h-[360px]">
                  <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/20">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </article>
            </section>
          ))}
        </div>

        {/* Arrows */}
        <div className="absolute inset-x-0 bottom-3 md:bottom-4 flex items-center justify-center gap-6">
          <button
            onClick={prev}
            aria-label="Previous"
            className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next"
            className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
