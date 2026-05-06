"use client";

import React from "react";
import { X } from "lucide-react";
import { StyleFamily, STYLE_LABELS } from "./types";
import { StyleFilterDropdown } from "@/components/ui/StyleFiltersBar";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface TangaliyaHeaderProps {style: StyleFamily;
  onStyleChange: (s: StyleFamily) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function TangaliyaHeader({style, onStyleChange, onClose, disabled}: TangaliyaHeaderProps) {
  const families: StyleFamily[] = ["V1", "V2", "V3"];
  const styleNameOptions = React.useMemo(
    () =>
      STYLES.map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [],
  );

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0E0E12] px-5 py-3">
      <div className="flex items-center gap-3">
        <StyleFilterDropdown
          ariaLabel="Select style"
          value="tangaliya"
          options={styleNameOptions}
          onChange={(styleId) => {
            onClose();
            window.dispatchEvent(
              new CustomEvent("wm:style-navigate", { detail: { styleId } }),
            );
          }}
          className="w-[160px]"
          buttonClassName="flex h-[30px] w-full items-center justify-between gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] outline-none transition hover:border-[#2F6BFF]/40 hover:bg-[#2F6BFF]/[0.14]"
        />

        <div className="ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-[#13131a] p-[3px]">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onStyleChange(f)} disabled={disabled}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-[11px] font-medium transition-all duration-150 ${
                style === f
                  ? "bg-[#1e1e28] text-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                  : "text-white/30 hover:text-white/55"
              }`}
            >
              <span>{f}</span>
              <span
                className={`rounded-[4px] px-[5px] py-px text-[9px] font-semibold tracking-[0.04em] ${
                  style === f
                    ? "bg-[#2F6BFF]/[0.12] text-[#60a5fa]"
                    : "bg-white/[0.04] text-white/20"
                }`}
              >
                {STYLE_LABELS[f].badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.08] hover:text-white/70"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

