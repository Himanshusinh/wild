"use client";

import React from "react";
import { Variation, VARIATIONS } from "./types";

interface VariationSelectorProps {
  value: Variation;
  onChange: (v: Variation) => void;
}

export function VariationSelector({ value, onChange }: VariationSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {VARIATIONS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`flex flex-1 flex-col items-center rounded-xl border px-2 py-2.5 transition-all duration-150 ${
            value === v.id
              ? "border-[#2F6BFF]/30 bg-[#2F6BFF]/[0.1] text-[#60a5fa]"
              : "border-white/10 bg-[#13131a] text-white/35 hover:border-white/20 hover:text-white/60"
          }`}
        >
          <span className="text-[11px] font-medium">{v.label}</span>
          <span className={`mt-px text-[10px] ${value === v.id ? "text-[#60a5fa]/50" : "text-white/20"}`}>
            {v.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
