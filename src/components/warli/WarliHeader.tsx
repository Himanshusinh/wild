"use client";

import React from "react";
import { X } from "lucide-react";
import { StyleFamily, STYLE_LABELS } from "./types";
import { StyleFilterDropdown } from "@/components/ui/StyleFiltersBar";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface WarliHeaderProps {
  style: StyleFamily;
  onStyleChange: (s: StyleFamily) => void;
  onStyleNameSelect?: (styleId: string) => void;
  onClose: () => void;
  isLocked?: boolean;
}

export function WarliHeader({
  style,
  onStyleChange,
  onStyleNameSelect,
  onClose,
  isLocked,
}: WarliHeaderProps) {
  const families: StyleFamily[] = ["V1", "V2", "V3"];
  const styleNameOptions = React.useMemo(
    () =>
      STYLES.map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [],
  );

  const handleStylePick = (styleId: string) => {
    if (onStyleNameSelect) {
      onStyleNameSelect(styleId);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("wm:style-navigate", { detail: { styleId } }),
    );
  };

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0a0f] px-5 py-3">
      <div className="flex items-center gap-3">
        <StyleFilterDropdown
          ariaLabel="Select style"
          value="Maharashtra"
          options={styleNameOptions}
          onChange={(styleId) => {
            onClose();
            handleStylePick(styleId);
          }}
          className="w-[220px]"
          buttonClassName="flex h-[30px] w-full items-center justify-between gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] outline-none transition hover:border-[#2F6BFF]/40 hover:bg-[#2F6BFF]/[0.14]"
        />

        <div className="ml-1 flex gap-1 rounded-[14px] border border-white/5 bg-black/40 p-[3px]">
          {families.map((f) => {
            const isActive = style === f;
            const label = STYLE_LABELS[f].badge;

            return (
              <button
                key={f}
                type="button"
                disabled={isLocked}
                onClick={() => onStyleChange(f)}
                className={`group flex items-center gap-2.5 rounded-[10px] px-3 py-1.5 transition-all duration-300 ${isActive
                    ? "bg-[#1c1c26] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.08]"
                    : "hover:bg-white/[0.04]"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span
                  className={`text-[12px] font-bold tracking-tight transition-colors ${isActive
                      ? "text-[#58a6ff]"
                      : "text-white/30 group-hover:text-white/50"
                    }`}
                >
                  {f}
                </span>
                <span
                  className={`rounded-[6px] px-1.5 py-[3px] text-[9px] font-black uppercase tracking-wider transition-all ${isActive
                      ? "bg-[#162a4d] text-[#58a6ff] ring-1 ring-[#58a6ff]/20"
                      : "bg-white/[0.03] text-white/15"
                    }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
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
