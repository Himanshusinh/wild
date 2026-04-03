"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { ModelId, MODELS } from "./types";

interface ModelSelectorProps {
  value: ModelId;
  onChange: (m: ModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150 ${
          open
            ? "border-white/20 bg-[#13131a]"
            : "border-white/10 bg-[#13131a] hover:border-white/15"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              open ? "bg-[#2F6BFF] shadow-[0_0_6px_rgba(47,107,255,0.8)]" : "bg-[#2F6BFF]/60"
            }`}
          />
          <span className="font-medium text-white/80">{selected.label}</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/30 bg-white/[0.04] border border-white/[0.06]">
            {selected.tag}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#13131a] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {MODELS.map((m) => {
            const isActive = m.id === value;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors duration-100 ${
                  isActive
                    ? "bg-[#2F6BFF]/10 text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/85"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? "bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.7)]" : "bg-white/15"
                    }`}
                  />
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[10px] text-white/30">{m.tag}</span>
                </div>
                {isActive && <Check className="h-3 w-3 text-[#2F6BFF]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
