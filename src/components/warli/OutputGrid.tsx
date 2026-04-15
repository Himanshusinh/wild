"use client";

import React from "react";
import { Download, Expand } from "lucide-react";

interface OutputGridProps {
  images: string[];
  count: number;
  onSaveImage?: (index: number) => void;
  onExpandImage?: (index: number) => void;
}

function Placeholder() {
  return <div className="flex h-full w-full items-center justify-center bg-[#13131a]" />;
}

export function OutputGrid({ images, count, onSaveImage, onExpandImage }: OutputGridProps) {
  return (
    <div className={`grid gap-3 ${count === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-2"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#13131a] transition-all hover:border-white/20"
        >
          {images[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[i]} alt={`Generated ${i + 1}`} className="h-full w-full object-cover" />
          ) : (
            <Placeholder />
          )}
          {images[i] ? (
            <div
              className="absolute inset-0 flex items-end p-3 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }}
            >
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-sm transition hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveImage?.(i);
                  }}
                >
                  <Download className="h-3 w-3" /> Save
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-sm transition hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandImage?.(i);
                  }}
                >
                  <Expand className="h-3 w-3" /> Expand
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
