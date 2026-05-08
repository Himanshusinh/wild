"use client";

import React from "react";
import {
  Search,
  CalendarDays,
  Download,
  HeartOff,
  ArrowRight,
} from "lucide-react";

interface HistoryFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryFilterDropdown({
  isOpen,
  onClose,
}: HistoryFilterDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-1.5 w-[calc(100vw-32px)] md:w-[420px] bg-[#0E0E11] border border-white/10 rounded-xl shadow-2xl z-[100] p-3.5 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
      {/* Sort Section */}
      <div className="space-y-1.5 mb-3.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">
          Sort Order
        </h3>
        <div className="flex items-center gap-2">
          <button className="flex-1 h-7 bg-white text-black font-medium rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all">
            Newest
          </button>
          <button className="flex-1 h-7 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] text-white/60 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all">
            Oldest
          </button>
        </div>
      </div>

      {/* Row 1: Date Range */}
      <div className="space-y-1.5 mb-3.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">
          Date Range
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Start"
              className="w-full h-7 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 pr-7 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
            />
            <CalendarDays size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
          <ArrowRight size={10} className="text-white/20" />
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="End"
              className="w-full h-7 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 pr-7 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
            />
            <CalendarDays size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mb-3.5">
        {/* Tool */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Tool</h3>
          <div className="flex flex-wrap gap-1">
            <div className="relative w-full mb-1">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Tools..."
                className="w-full h-6.5 bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
              />
            </div>
            {["Upscale", "Retouch", "Mockup"].map((t) => (
              <button key={t} className="h-6 px-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] text-white/60 hover:bg-white/10 transition-all">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Style</h3>
          <div className="flex flex-wrap gap-1">
            <div className="relative w-full mb-1">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Styles..."
                className="w-full h-6.5 bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
              />
            </div>
            {["Photo", "Anime", "3D"].map((s) => (
              <button key={s} className="h-6 px-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] text-white/60 hover:bg-white/10 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5 col-span-2">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Aspect Ratio</h3>
          <div className="flex flex-wrap gap-1">
            {["Any", "1:1", "4:3", "3:2", "16:9"].map((r) => (
              <button key={r} className={`h-6 px-2 rounded-lg text-[9px] transition-all ${r === "Any" ? "bg-white text-black font-medium" : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Section */}
      <div className="space-y-1.5 mb-4.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Model</h3>
        <div className="flex flex-wrap gap-1">
          <div className="relative w-28 h-6.5">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Models..."
              className="w-full h-full bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
            />
          </div>
          {["Flux Dev", "Classic", "Nano Banana"].map((m) => (
            <button key={m} className="h-6.5 px-2 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] text-white/60 hover:bg-white/10 transition-all">
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex pt-3 border-t border-white/5">
        <button className="px-2.5 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] text-white/80 font-medium hover:bg-white/10 transition-all">
          Clear all
        </button>
      </div>
    </div>
  );
}
