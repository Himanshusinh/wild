"use client";

import React from "react";
import { InputMode } from "./types";

interface ModeToggleProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-[3px] rounded-xl border border-white/10 bg-transparent p-[3px]">
      <button
        type="button"
        onClick={() => onChange("text")}
        disabled={disabled}
        className={`flex items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-[11px] font-medium transition-all duration-150 ${
          mode === "text"
            ? "bg-[#1e1e28] text-white/80 shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
            : "text-white/30 hover:text-white/55"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4h12v1.5H2V4zm0 3h12v1.5H2V7zm0 3h8v1.5H2V10z" />
        </svg>
        Describe scene
      </button>

      <button
        type="button"
        onClick={() => onChange("image")}
        disabled={disabled}
        className={`flex items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-[11px] font-medium transition-all duration-150 ${
          mode === "image"
            ? "bg-[#1e1e28] text-white/80 shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
            : "text-white/30 hover:text-white/55"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="14" height="10" rx="2" />
          <circle cx="5.5" cy="7" r="1.5" fill="currentColor" stroke="none" />
          <path d="M2 13l4-4 3 3 2-2 3 4H2z" fill="currentColor" stroke="none" opacity="0.5" />
        </svg>
        Upload photo
      </button>
    </div>
  );
}
