"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { STYLES } from "./CreativeStyle";

interface AllStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleSelect: (id: string) => void;
}

export default function AllStylesModal({ isOpen, onClose, onStyleSelect }: AllStylesModalProps) {
  const [visibleCount, setVisibleCount] = React.useState(STYLES.length);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [scrollMetrics, setScrollMetrics] = React.useState({ clientHeight: 1, scrollHeight: 1 });
  const [isDraggingThumb, setIsDraggingThumb] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const dragStateRef = React.useRef<{ startY: number; startTop: number } | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(STYLES.length);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
      setScrollTop(0);
      setScrollMetrics({
        clientHeight: listRef.current.clientHeight || 1,
        scrollHeight: listRef.current.scrollHeight || 1,
      });
    }
  }, [isOpen]);

  const handleGridScroll = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setScrollMetrics({ clientHeight: el.clientHeight, scrollHeight: el.scrollHeight });
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 320;
    if (!nearBottom) return;
    setVisibleCount((prev) => Math.min(STYLES.length, prev + 40));
  }, []);

  if (!isOpen) return null;
  const maxScroll = Math.max(1, scrollMetrics.scrollHeight - scrollMetrics.clientHeight);
  const thumbHeight = Math.max(36, (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * 100);
  const thumbTop = (scrollTop / maxScroll) * (100 - thumbHeight);

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = { startY: e.clientY, startTop: scrollTop };
    setIsDraggingThumb(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb || !dragStateRef.current || !listRef.current) return;
    const { startY, startTop } = dragStateRef.current;
    const deltaY = e.clientY - startY;
    const trackHeight = scrollMetrics.clientHeight;
    const scrollable = Math.max(1, scrollMetrics.scrollHeight - scrollMetrics.clientHeight);
    const scrollDelta = (deltaY / Math.max(1, trackHeight)) * scrollable;
    const next = Math.max(0, Math.min(scrollable, startTop + scrollDelta));
    listRef.current.scrollTop = next;
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current = null;
    setIsDraggingThumb(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6" onClick={onClose}>
      <div 
        className="relative w-full max-w-8xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-7">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
              Explore All Styles
            </h2>
            <p className="text-xs text-white/30 font-medium uppercase tracking-widest mt-1">Select a style to begin generating</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid Content */}
        <div
          ref={listRef}
          onScroll={handleGridScroll}
          className="flex-1 min-h-0 overflow-y-scroll p-4 pr-4 sm:p-6 sm:pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:w-0"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {STYLES.slice(0, visibleCount).map((style) => (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style.id)}
                className="group flex flex-col text-left transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#18181f] transition-colors group-hover:border-white/20">
                  <Image
                    src={style.image}
                    alt={style.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: style.imageFilter as React.CSSProperties["filter"] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-[18px] font-bold uppercase tracking-wider text-white sm:text-[22px]" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                      {style.title}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">
                      {style.name}
                    </div>
                    <div className="mt-1 text-[10px] leading-snug text-white/55 line-clamp-2">
                      {style.desc}
                    </div>
                  </div>

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
                      {style.tag}
                    </span>
                  </div>
                </div>
                
                <div className="sr-only">
                  <div>{style.name}</div>
                  <p>{style.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute right-1.5 top-[76px] bottom-3 w-2 rounded-full bg-white/10">
          <div
            role="scrollbar"
            aria-valuemin={0}
            aria-valuemax={Math.round(maxScroll)}
            aria-valuenow={Math.round(scrollTop)}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerUp}
            className={`absolute left-0 right-0 rounded-full bg-[#3B82F6]/90 shadow-[0_0_10px_rgba(59,130,246,0.35)] ${
              isDraggingThumb ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ height: `${thumbHeight}%`, top: `${thumbTop}%` }}
          />
        </div>
      </div>
    </div>
  );
}
