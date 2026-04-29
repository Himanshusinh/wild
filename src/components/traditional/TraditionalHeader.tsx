"use client";

import React from "react";
import { X, Sparkles, Wand2, Boxes, Palette } from "lucide-react";
import type { StyleVersion } from "./types";

interface TraditionalHeaderProps {
  style: StyleVersion;
  styleTitle: string;
  onStyleChange: (s: StyleVersion) => void;
  onClose: () => void;
}

export function TraditionalHeader({
  style,
  styleTitle,
  onStyleChange,
  onClose,
}: TraditionalHeaderProps) {
  const versions: { id: StyleVersion; label: string; icon: React.ReactNode }[] = [
    { id: "V1", label: "Authentic", icon: <Boxes size={14} /> },
    { id: "V2", label: "Artisan", icon: <Palette size={14} /> },
    { id: "V3", label: "Cinematic", icon: <Sparkles size={14} /> },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500 ring-1 ring-blue-600/20">
            <Wand2 size={18} />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white/90">
            {styleTitle} <span className="text-white/20 ml-2">Generator</span>
          </h1>
        </div>

        <div className="hidden h-4 w-[1px] bg-white/10 sm:block" />

        <div className="hidden items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/[0.05] sm:flex">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => onStyleChange(v.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                style === v.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-white/40 hover:bg-white/5 hover:text-white/60"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onClose}
        className="group flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-white/40 ring-1 ring-white/[0.08] transition-all hover:bg-white/[0.08] hover:text-white hover:ring-white/20 active:scale-90"
      >
        <X size={18} className="transition-transform group-hover:rotate-90" />
      </button>
    </header>
  );
}
