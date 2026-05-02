"use client";

import React from "react";
import { X } from "lucide-react";
import { StyleFamily } from "./types";

interface WarliHeaderProps {
  style: StyleFamily;
  onStyleChange: (s: StyleFamily) => void;
  onClose: () => void;
  isLocked?: boolean;
}

export function WarliHeader({
  style,
  onStyleChange,
  onClose,
  isLocked,
}: WarliHeaderProps) {
  const families: StyleFamily[] = ["V1", "V2", "V3"];

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0a0f] px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-2.5 py-[5px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.8)]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa]">
            Warli
          </span>
        </div>

        <div className="ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-transparent p-[3px]">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              disabled={isLocked}
              onClick={() => onStyleChange(f)}
              className={`min-w-[54px] rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                style === f
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/[0.04] hover:text-white/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
