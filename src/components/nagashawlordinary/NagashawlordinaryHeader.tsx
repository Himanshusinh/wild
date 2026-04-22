"use client";
import React from "react";
import { X } from "lucide-react";
import { StyleFamily, STYLE_LABELS } from "./types";

export function NagashawlordinaryHeader({
  style,
  onStyleChange,
  onClose,
}: {
  style: StyleFamily;
  onStyleChange: (s: StyleFamily) => void;
  onClose: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[#0E0E12] px-6 py-4">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">NAGA SHAWL</h2>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex gap-1">
          {(["V1", "V2", "V3"] as StyleFamily[]).map((v) => (
            <button
              key={v}
              onClick={() => onStyleChange(v)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                style === v
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              {STYLE_LABELS[v].badge}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="rounded-full p-2 text-white/40 transition hover:bg-white/5 hover:text-white">
        <X size={18} />
      </button>
    </header>
  );
}
